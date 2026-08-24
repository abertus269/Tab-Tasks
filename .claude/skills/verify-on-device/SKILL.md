---
name: verify-on-device
description: Build tab-tasks as a release APK and prove it runs natively on the connected Android phone — no Metro, no dev server, real install, real SQLite persistence, real fresh-install migration. Use when asked to verify a build on the phone, confirm the app runs natively, or check that a device build actually works.
tools: Bash, Read, SendUserFile
---

# verify-on-device

Proves the app runs standalone on real hardware — not "the debug client launched while Metro fed it
JS," but "the installed APK is self-contained and works with the laptop unplugged." Android only:
`/ios` is gitignored and absent from this repo, and this is a Windows machine.

**Nine gates, fail-fast.** Stop at the first failure, print the raw error plus what it means, and do
not proceed to later gates. Do not edit app source to make a gate pass — report it. A stray mechanical
retry (killing the adb server, uninstalling a signature-mismatched package) is fine; changing
`src/` is not. See `references/failures.md` for the known-signature → action table before improvising.

Every gate writes evidence to `.artifacts/device-verify/<run-timestamp>/`. It's gitignored — safe to
leave around.

## Setup used by every gate

```bash
ADB="${ANDROID_HOME:-$LOCALAPPDATA/Android/Sdk}/platform-tools/adb"
RUN_TS=$(date +%Y%m%d-%H%M%S)
ART=".artifacts/device-verify/$RUN_TS"
mkdir -p "$ART"
PKG="com.abertus.tabtasks"
```

Resolve `$JAVA_HOME/bin/java`, **never** bare `java` — this machine has an old Oracle Java 8 first on
PATH while `JAVA_HOME` points at the JDK 17 that Gradle actually uses. Checking bare `java -version`
produces a false failure.

## Gate 0 — Preflight

```bash
"$ADB" devices -l
```

Require **exactly one** device in state `device`. Distinguish the failure modes:
- no lines after the header → nothing connected, stop and ask the user to plug in / enable USB debugging
- `unauthorized` → phone is locked or the RSA prompt wasn't accepted, stop and ask the user to unlock and accept it
- `offline` → try `"$ADB" kill-server && "$ADB" start-server` once, then re-check

Capture the serial into `$SERIAL`, then fingerprint the device into the report:

```bash
"$ADB" -s "$SERIAL" shell getprop ro.product.model
"$ADB" -s "$SERIAL" shell getprop ro.build.version.release
"$ADB" -s "$SERIAL" shell getprop ro.build.version.sdk
"$ADB" -s "$SERIAL" shell getprop ro.product.cpu.abi
```

Confirm the JDK:

```bash
"$JAVA_HOME/bin/java" -version
```

Confirm `android/` exists (it's gitignored — a fresh clone won't have it). If missing:
`npx expo prebuild -p android`.

## Gate 1 — Static checks

Fast (seconds), so it runs before the multi-minute Gradle build. Metro strips TypeScript types
without checking them, so a type error would otherwise ship silently into a "working" build.

```bash
npx tsc --noEmit
npm run lint
npm test
```

All three must exit 0. Skip this gate only if the user explicitly asks (`--skip-static` equivalent) —
otherwise a failure here stops the run before gate 2.

## Gate 2 — Build + install, release variant

Release is the gate, not debug: `--variant release` embeds the JS bundle directly in the APK
(`android/app/build.gradle:115` signs release with the debug keystore, so no keystore setup is
needed; `minifyEnabled` defaults to `false` per `android/app/build.gradle:69`, so no ProGuard-strip
surprises). Debug pulls JS from Metro over `adb reverse` and proves nothing about standalone operation.

First, assert nothing is already serving on 8081 — a stray Metro instance would let a broken release
build limp along on borrowed JS and invalidate the whole verification:

```bash
netstat -ano | grep ":8081 " && echo "STOP: something is listening on 8081 — kill it before continuing"
```

Then build and install directly to the device, with no bundler spun up. Omit `-d`/`--device` — the
CLI's device matcher does not accept a bare adb serial in this setup (`Could not find device with
name: <serial>`, confirmed twice), and it's unneeded anyway when gate 0 already established exactly
one device is attached:

```bash
BUILD_START=$(date +%s)
npx expo run:android --variant release --no-bundler 2>&1 | tee "$ART/gate2-build.log"
```

(Faster iteration only: `ORG_GRADLE_PROJECT_reactNativeArchitectures=arm64-v8a` restricts the native
build to the connected device's ABI instead of all four in `android/gradle.properties:31`. Leave this
off for the build that's actually being verified — it should match a real release build.)

Verify the JS was actually embedded, not just that Gradle exited 0:

```bash
grep -q "createBundleReleaseJsAndAssets" "$ART/gate2-build.log" || echo "STOP: JS bundle task did not run"
APK=android/app/build/outputs/apk/release/app-release.apk
ls -la "$APK"
```

Do **not** additionally assert the APK file's mtime is newer than `$BUILD_START`: on an incremental
build where nothing changed since the last verified release, Gradle correctly reports `packageRelease`
as `UP-TO-DATE` and reuses the existing file unchanged — that's healthy caching, not staleness, and a
raw mtime check false-positives on it every time (confirmed live). Gate 3's device-side
`lastUpdateTime` is the real proof that *this run* installed the APK; that's the authoritative check.

## Gate 3 — Install identity

Confirms the APK just installed is the one being verified, not a previously-installed build. This is
the authoritative "did this run actually install something" check — trust it over any local file
timestamp, which can lag behind on a correctly-cached incremental build (see gate 2).

```bash
"$ADB" -s "$SERIAL" shell dumpsys package "$PKG" | grep -E "versionName|lastUpdateTime"
```

`versionName` must equal `app.json`'s `expo.version` (currently `1.0.0`). `lastUpdateTime` must fall
after `$BUILD_START`.

## Gate 4 — Cold launch, standalone

Re-assert 8081 is still closed — this is the actual crux of the whole skill: nothing on the laptop is
serving this app.

```bash
netstat -ano | grep ":8081 " && echo "STOP: something started serving on 8081"

"$ADB" -s "$SERIAL" shell am force-stop "$PKG"
"$ADB" -s "$SERIAL" logcat -c
"$ADB" -s "$SERIAL" shell am start -W -n "$PKG/.MainActivity" | tee "$ART/gate4-launch.log"
```

Capture `TotalTime` from the output for the report. Then poll for 10s that the process is alive and
*not* crash-looping:

```bash
for i in $(seq 1 10); do
  PID=$("$ADB" -s "$SERIAL" shell pidof "$PKG")
  echo "t=${i}s pid=$PID"
  sleep 1
done
```

A stable non-empty pid across the loop = pass. Empty or changing pid = crash loop, stop.

## Gate 5 — Runtime log scan

```bash
"$ADB" -s "$SERIAL" logcat -d > "$ART/gate5-logcat.txt"
grep -E "FATAL EXCEPTION|AndroidRuntime.*E |ReactNativeJS.*(Error|Exception)|Unable to load script|couldn't find DSO|Migration error" "$ART/gate5-logcat.txt"
```

Deliberately **not** matching on bare `SoLoader` — every native RN launch logs several benign
`I`/`W` SoLoader init lines (`SoLoader initialized: ...`), and matching the word alone is a
guaranteed false positive on a healthy run. If a real SoLoader failure needs catching, match its
actual failure text (`couldn't find DSO`) instead, already covered above.

Expect vendor/OEM noise at `E` priority even on a healthy launch — MediaTek devices in particular log
SELinux denials for vendor services and `HWUI`/`Gralloc` render-thread chatter on every cold start.
None of that is a genuine signature above; don't broaden the grep to catch it.

Any match on the pattern above fails the gate — surface the matched lines plus a few lines of context
(`grep -B2 -A10` around the first FATAL) as the raw evidence.

## Gate 6 — Visual proof, both tabs

Poll for the splash screen to clear (`src/app/_layout.tsx:44` renders `null` until fonts +
migrations both resolve — if this never happens, the specific diagnosis is "fonts or drizzle
migrations never resolved," not a generic crash):

```bash
for i in $(seq 1 15); do
  "$ADB" -s "$SERIAL" exec-out screencap -p > "$ART/poll-$i.png"
  sleep 1
done
```

Read back the last capture with the Read tool. Expect a dark `#0D0D0D` background with a real task
list — not white/blank, not a redbox, not the `Database error:` text from
`src/app/_layout.tsx:52`. If still blank at 15s, that's a hard gate failure with that diagnosis.

```bash
"$ADB" -s "$SERIAL" exec-out screencap -p > "$ART/01-tasks.png"
```

Switch tabs to prove the JS thread is live and interactive, not a frozen first frame:

```bash
"$ADB" -s "$SERIAL" shell uiautomator dump /sdcard/ui.xml
"$ADB" -s "$SERIAL" pull /sdcard/ui.xml "$ART/gate6-ui.xml"
grep -o 'text="Calendar"[^/]*bounds="\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]"' "$ART/gate6-ui.xml"
```

Parse the bounds, compute the center point, tap it:

```bash
"$ADB" -s "$SERIAL" shell input tap <cx> <cy>
sleep 1
"$ADB" -s "$SERIAL" exec-out screencap -p > "$ART/02-calendar.png"
```

Read back `02-calendar.png` — expect the Day/Week/Month/Year segmented control under the Calendar
header (`DESIGN.md` §6).

## Gate 7 — Write + restart persistence

The `expo-sqlite`/drizzle gate. Tap `Add task` (label `"Add task"` from
`src/components/AddTaskButton.tsx:17`), type a unique title, save, and confirm the write survives a
real process death — not just a JS reload.

```bash
grep -o 'text="Add task"[^/]*bounds="\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]"' "$ART/gate6-ui.xml"
# tap its center, then dump UI again to find the title TextInput (placeholder "Task title")
```

Type a title that's easy to recognize and grep for later:

```bash
MARKER="VERIFY-$(date +%s)"
"$ADB" -s "$SERIAL" shell input tap <title-field-cx> <title-field-cy>
"$ADB" -s "$SERIAL" shell input text "$MARKER"
```

Save via the button labeled `"Save task"` (`src/app/task-form.tsx:131` — this label was added
specifically so this gate doesn't have to guess at an icon-only button's tap target):

```bash
"$ADB" -s "$SERIAL" shell uiautomator dump /sdcard/ui.xml && "$ADB" -s "$SERIAL" pull /sdcard/ui.xml "$ART/gate7-form.xml"
grep -o 'text="Save task"[^/]*bounds="\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]"' "$ART/gate7-form.xml"
# tap its center
"$ADB" -s "$SERIAL" exec-out screencap -p > "$ART/03-created.png"
```

Read back `03-created.png` and confirm the `$MARKER` row is visible. Then force-stop and relaunch —
this is real process death on real hardware, not a JS-level refresh:

```bash
"$ADB" -s "$SERIAL" shell am force-stop "$PKG"
"$ADB" -s "$SERIAL" shell am start -W -n "$PKG/.MainActivity"
sleep 2
"$ADB" -s "$SERIAL" exec-out screencap -p > "$ART/04-after-restart.png"
```

Read back `04-after-restart.png` — the `$MARKER` row must still be there. Note in the report: release
builds aren't debuggable, so `adb run-as` can't read the SQLite file directly; verifying through the
UI after real process death is the stronger end-to-end claim anyway.

## Gate 8 — First run from empty (migrations + seed)

Proves `useMigrations` (`src/app/_layout.tsx:36`) applies the full migration chain against an empty
database and `seedIfEmpty` runs — the "data must survive updates" invariant from `CLAUDE.md`, checked
for real. This also cleans up the `$MARKER` task from gate 7, leaving the device in a fresh seeded
state.

```bash
"$ADB" -s "$SERIAL" shell pm clear "$PKG"
"$ADB" -s "$SERIAL" shell am start -W -n "$PKG/.MainActivity"
sleep 3
"$ADB" -s "$SERIAL" exec-out screencap -p > "$ART/05-fresh-install.png"
```

Read back `05-fresh-install.png` — splash cleared, seeded content visible, no `Database error:` text.

## Report

Print a table: gate name, PASS/FAIL, key evidence (launch `TotalTime`, APK path + size, artifact
filenames). Then `SendUserFile` the screenshots (`01-tasks.png` through `05-fresh-install.png`) so the
user sees the actual device state, not just a claim.

On any failure: stop, state which gate failed, paste the raw error output, give the interpretation
(check `references/failures.md` for known signatures first), and list what still needs the user's
input. Never mark a later gate PASS after an earlier one failed.
