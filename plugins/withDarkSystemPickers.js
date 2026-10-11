// Themes the native Android surfaces the app doesn't draw itself — the
// DateTimePickerAndroid date/time dialogs, the text cursor and selection
// handles, and Switch — from the app's own palette (src/theme/tokens.ts).
// Without this they fall back to the AppCompat dark defaults: a teal accent,
// square-cornered grey dialogs, and a teal caret in every TextInput.
//
// Lives in a config plugin rather than a hand-edit of android/ because
// android/ is generated (gitignored) and `expo prebuild` would erase it.
const { AndroidConfig, withAndroidColors, withAndroidStyles } = require('expo/config-plugins');

// Mirrors src/theme/tokens.ts — kept as literals because a config plugin
// runs in Node at prebuild time and can't import the app's TS modules.
const ACCENT = '#D6FF5C';
const BG_BASE = '#0D0D0D';
const BG_SURFACE = '#1A1A1A';
const BG_SURFACE_RAISED = '#232323';
const TEXT_PRIMARY = '#F5F5F5';
const TEXT_SECONDARY = '#9A9A9A';

const COLORS = {
  colorAccent: ACCENT,
  pickerBackground: BG_SURFACE_RAISED,
  pickerHeader: BG_SURFACE,
  pickerTextPrimary: TEXT_PRIMARY,
  pickerTextSecondary: TEXT_SECONDARY,
  pickerOnAccent: BG_BASE,
};

function withPickerColors(config) {
  return withAndroidColors(config, (cfg) => {
    for (const [name, value] of Object.entries(COLORS)) {
      cfg.modResults = AndroidConfig.Colors.assignColorValue(cfg.modResults, { name, value });
    }
    return cfg;
  });
}

function setItem(xml, parent, name, value) {
  return AndroidConfig.Styles.assignStylesValue(xml, { add: true, parent, name, value });
}

function withPickerStyles(config) {
  return withAndroidStyles(config, (cfg) => {
    let xml = cfg.modResults;

    const appTheme = { name: 'AppTheme', parent: 'Theme.AppCompat.DayNight.NoActionBar' };
    xml = setItem(xml, appTheme, 'colorAccent', '@color/colorAccent');
    xml = setItem(xml, appTheme, 'colorControlActivated', '@color/colorAccent');
    xml = setItem(xml, appTheme, 'android:datePickerDialogTheme', '@style/TabTasksPickerDialog');
    xml = setItem(xml, appTheme, 'android:timePickerDialogTheme', '@style/TabTasksPickerDialog');

    const dialog = { name: 'TabTasksPickerDialog', parent: 'Theme.AppCompat.Dialog' };
    xml = setItem(xml, dialog, 'colorAccent', '@color/colorAccent');
    xml = setItem(xml, dialog, 'android:colorBackground', '@color/pickerBackground');
    xml = setItem(xml, dialog, 'android:textColorPrimary', '@color/pickerTextPrimary');
    xml = setItem(xml, dialog, 'android:textColorSecondary', '@color/pickerTextSecondary');
    // Selected day number / selected hour sit on the lime circle — dark text.
    xml = setItem(xml, dialog, 'android:textColorPrimaryInverse', '@color/pickerOnAccent');
    xml = setItem(xml, dialog, 'android:datePickerStyle', '@style/TabTasksDatePicker');
    xml = setItem(xml, dialog, 'android:timePickerStyle', '@style/TabTasksTimePicker');

    // A dark header instead of a lime slab: white header text on lime is
    // ~1.1:1, unreadable.
    const datePicker = { name: 'TabTasksDatePicker', parent: 'android:Widget.Material.DatePicker' };
    xml = setItem(xml, datePicker, 'android:headerBackground', '@color/pickerHeader');

    const timePicker = { name: 'TabTasksTimePicker', parent: 'android:Widget.Material.TimePicker' };
    xml = setItem(xml, timePicker, 'android:headerBackground', '@color/pickerHeader');
    xml = setItem(xml, timePicker, 'android:numbersBackgroundColor', '@color/pickerHeader');
    xml = setItem(xml, timePicker, 'android:numbersSelectorColor', '@color/colorAccent');

    cfg.modResults = xml;
    return cfg;
  });
}

module.exports = function withDarkSystemPickers(config) {
  return withPickerStyles(withPickerColors(config));
};
