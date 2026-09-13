import { buildPickerItems, getIcon, ICON_GROUPS, ICON_KEYWORDS, ICON_NAMES, ICONS, searchIconGroups } from '../icons';

// Every one of these shipped before the ~100-icon expansion and is stored
// verbatim in real task/category rows — a rename or removal would silently
// blank out someone's existing icon (getIcon returns null for an unknown
// name), so this list is the regression guard for that.
const LEGACY_NAMES = [
  'list-todo',
  'user',
  'briefcase',
  'graduation-cap',
  'book-open',
  'calendar',
  'calendar-days',
  'clock',
  'house',
  'heart',
  'dumbbell',
  'coffee',
  'utensils',
  'shopping-cart',
  'plane',
  'car',
  'bike',
  'wallet',
  'credit-card',
  'phone',
  'mail',
  'message-circle',
  'music',
  'palette',
  'code',
  'pill',
  'stethoscope',
  'dog',
  'cat',
  'baby',
  'star',
  'flag',
  'bell',
  'pencil',
  'camera',
  'film',
  'gamepad-2',
  'tree-pine',
  'sun',
  'moon',
  'umbrella',
  'wrench',
  'target',
  'trophy',
  'map-pin',
];

describe('ICON_GROUPS / ICONS / ICON_NAMES', () => {
  it('has no duplicate names across groups', () => {
    const allNames = ICON_GROUPS.flatMap((group) => Object.keys(group.icons));
    expect(new Set(allNames).size).toBe(allNames.length);
  });

  it('every name resolves via getIcon', () => {
    for (const name of ICON_NAMES) {
      expect(getIcon(name)).toBeTruthy();
    }
  });

  it('has at least 95 icons', () => {
    expect(ICON_NAMES.length).toBeGreaterThanOrEqual(95);
  });

  it('keeps every legacy name that shipped before the expansion', () => {
    for (const name of LEGACY_NAMES) {
      expect(ICONS[name]).toBeTruthy();
    }
  });

  it('every group has a non-empty, unique label and at least one icon', () => {
    const labels = ICON_GROUPS.map((g) => g.label);
    expect(new Set(labels).size).toBe(labels.length);
    for (const group of ICON_GROUPS) {
      expect(group.label.length).toBeGreaterThan(0);
      expect(Object.keys(group.icons).length).toBeGreaterThan(0);
    }
  });
});

describe('getIcon', () => {
  it('returns null for null, undefined, and unknown names', () => {
    expect(getIcon(null)).toBeNull();
    expect(getIcon(undefined)).toBeNull();
    expect(getIcon('not-a-real-icon')).toBeNull();
  });
});

describe('ICON_KEYWORDS', () => {
  it('every keyword key is a known icon name', () => {
    for (const name of Object.keys(ICON_KEYWORDS)) {
      expect(ICON_NAMES).toContain(name);
    }
  });
});

describe('searchIconGroups', () => {
  it('an empty or whitespace query returns every group in full, in order', () => {
    for (const query of ['', '   ']) {
      const result = searchIconGroups(query);
      expect(result.map((g) => g.label)).toEqual(ICON_GROUPS.map((g) => g.label));
      expect(result.reduce((sum, g) => sum + g.names.length, 0)).toBe(ICON_NAMES.length);
    }
  });

  it('matches a keyword and scopes to the owning group', () => {
    const result = searchIconGroups('gym');
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('Health');
    expect(result[0].names).toContain('dumbbell');
  });

  it('matches a substring of the icon name itself', () => {
    const result = searchIconGroups('dumb');
    expect(result.some((g) => g.names.includes('dumbbell'))).toBe(true);
  });

  it('is case-insensitive', () => {
    const result = searchIconGroups('GYM');
    expect(result.some((g) => g.names.includes('dumbbell'))).toBe(true);
  });

  it('drops groups with no match, and returns nothing for a nonsense query', () => {
    expect(searchIconGroups('zzzzzz')).toEqual([]);
  });
});

describe('buildPickerItems', () => {
  it('chunks a group into header + fixed-size rows, with expected keys', () => {
    const items = buildPickerItems([{ label: 'A', names: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }], 5);
    expect(items).toEqual([
      { type: 'header', key: 'h:A', label: 'A' },
      { type: 'row', key: 'r:A:0', icons: ['a', 'b', 'c', 'd', 'e'] },
      { type: 'row', key: 'r:A:1', icons: ['f', 'g'] },
    ]);
  });

  it('returns an empty array for no groups', () => {
    expect(buildPickerItems([], 5)).toEqual([]);
  });
});
