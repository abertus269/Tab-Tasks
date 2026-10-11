# Known failure signatures

Loaded only when a gate actually fails — not needed for a clean run. Each mechanical retry below is
allowed **once** per run and never touches app source (`src/`, `android/app/src`, config files). If
the retry doesn't fix it, stop and report both attempts.

| Signature (where it shows up) | Meaning | Action |
| --- | --- | --- |
| `error: device unauthorized` (gate 0) | Phone is locked, or the RSA debugging prompt was never accepted | Stop. Ask the user to unlock the phone and accept the "Allow USB debugging" prompt. Do not retry automatically — this needs a human tap. |
| `error: no devices/emulators found` (gate 0) | Cable, driver, or USB debugging toggle | `"$ADB" kill-server && "$ADB" start-server`, then re-run `devices -l` once. Still nothing → stop, ask user to check the cable/toggle. |
| device state `offline` (gate 0) | adb daemon got out of sync with the device | Same kill-server/start-server retry as above, once. |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` (gate 2) | The installed APK was signed with a different key/config than this build | `"$ADB" -s "$SERIAL" uninstall com.abertus.tabtasks`, then retry the install once. **Warn the user first: this wipes the app's on-device data.** |
| `INSTALL_FAILED_INSUFFICIENT_STORAGE` (gate 2) | Phone is out of space | Stop and report; not something to retry around. |
| `Unable to load script...` / red error screen mentioning the packager (gate 4/5) | The release APK has no embedded JS bundle — `createBundleReleaseJsAndAssets` didn't run or its output wasn't packaged | **Do not start Metro to paper over this.** This is exactly the failure mode the skill exists to catch. Stop, report gate 2's build log, and treat it as a real build config bug. |
| `couldn't find DSO` / `UnsatisfiedLinkError` / `SoLoader` errors (gate 5) | Native library missing or ABI mismatch for the connected device's `ro.product.cpu.abi` | `cd android && ./gradlew clean && cd ..`, then retry gate 2's build once. |
| Gradle `Could not resolve` / corrupted cache errors (gate 2) | Stale Gradle/dependency cache | Retry gate 2 once with `--no-build-cache` appended to the `expo run:android` invocation. |
| `Unsupported class file major version` (gate 2, Gradle output) | Gradle is running under the wrong JDK | Stop. Report that `JAVA_HOME` must point at JDK 17+ — do not fall back to whatever `java` resolves to on PATH (see SKILL.md's note on this machine's Java 8/17 split). |
| Splash never clears past 15s (gate 6) | `src/app/_layout.tsx:44` is stuck on `fontsLoaded && migrationsSuccess` never both becoming true | Not mechanically retryable — check gate 5's logcat dump for a migration or font-loading error and report it verbatim. This is an app bug, not infra; do not fix it as part of verification. |
| `Database error: ...` text visible on screen (gate 6/8) | `src/app/_layout.tsx:52` — `useMigrations` returned an error | Report the exact error text from the screenshot/logcat. App bug, not infra — do not fix it as part of verification. |
