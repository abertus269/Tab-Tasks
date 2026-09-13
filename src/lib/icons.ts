import type { LucideIcon } from 'lucide-react-native';
import {
  Activity,
  AlarmClock,
  Apple,
  Baby,
  Bandage,
  Banknote,
  Battery,
  Bed,
  Beer,
  Bell,
  Bike,
  Bookmark,
  BookOpen,
  Brain,
  Briefcase,
  Bus,
  Cake,
  Calculator,
  Calendar,
  CalendarDays,
  Camera,
  Car,
  Carrot,
  Cat,
  ChartLine,
  CircleCheck,
  ClipboardList,
  Clock,
  CloudRain,
  Code,
  Coffee,
  Coins,
  Compass,
  CreditCard,
  Dog,
  Dumbbell,
  FileText,
  Film,
  Flag,
  Flower2,
  Folder,
  Gamepad2,
  Gift,
  GraduationCap,
  Guitar,
  Hammer,
  Headphones,
  Heart,
  HeartPulse,
  Hospital,
  House,
  Key,
  Lamp,
  Landmark,
  Laptop,
  Leaf,
  ListTodo,
  Luggage,
  Mail,
  MapIcon,
  MapPin,
  MessageCircle,
  Moon,
  Music,
  NotebookPen,
  Paintbrush,
  Palette,
  PartyPopper,
  Pencil,
  Phone,
  PiggyBank,
  Pill,
  Pizza,
  Plane,
  Presentation,
  Receipt,
  Salad,
  Send,
  Settings,
  Shirt,
  ShoppingCart,
  Smartphone,
  Star,
  Stethoscope,
  Sun,
  Target,
  Ticket,
  TrainFront,
  Trash2,
  TreePine,
  Trophy,
  Umbrella,
  User,
  Users,
  Utensils,
  Wallet,
  Watch,
  WashingMachine,
  Wifi,
  Wine,
  Wrench,
  Zap,
} from 'lucide-react-native';

// Curated subset (SPEC.md §6 / DESIGN.md §5) — not the full ~3,500-icon
// library (the installed lucide-react-native ships 3,554 icon modules; the
// number in play here is a UX choice, not a bundle-size one — every chrome
// icon elsewhere in the app already imports from the same barrel, so the
// whole library is bundled regardless of how many names this file lists).
//
// Keys are the canonical Lucide kebab-case name, stored verbatim on tasks
// and categories — this map is the single place a rename has to be
// reconciled, and a key must never be renamed once shipped (existing rows
// reference it). Icons are grouped by theme so the picker (IconPicker.tsx)
// can render section headers; ICONS/ICON_NAMES/getIcon below are derived
// from the groups so every other consumer (DynamicIcon, FilterPill,
// TaskRow, CategoryBadge, category-manager, ...) is unaffected by the
// regrouping.
export interface IconGroup {
  label: string;
  icons: Record<string, LucideIcon>;
}

export const ICON_GROUPS: readonly IconGroup[] = [
  {
    label: 'General',
    icons: {
      'list-todo': ListTodo,
      star: Star,
      flag: Flag,
      bell: Bell,
      calendar: Calendar,
      'calendar-days': CalendarDays,
      clock: Clock,
      target: Target,
      'alarm-clock': AlarmClock,
      bookmark: Bookmark,
      'circle-check': CircleCheck,
    },
  },
  {
    label: 'Work & Study',
    icons: {
      briefcase: Briefcase,
      'graduation-cap': GraduationCap,
      'book-open': BookOpen,
      pencil: Pencil,
      code: Code,
      laptop: Laptop,
      presentation: Presentation,
      'file-text': FileText,
      folder: Folder,
      'clipboard-list': ClipboardList,
      'notebook-pen': NotebookPen,
      calculator: Calculator,
    },
  },
  {
    label: 'Home',
    icons: {
      house: House,
      wrench: Wrench,
      key: Key,
      lamp: Lamp,
      bed: Bed,
      'washing-machine': WashingMachine,
      hammer: Hammer,
      paintbrush: Paintbrush,
      'trash-2': Trash2,
      shirt: Shirt,
    },
  },
  {
    label: 'Health',
    icons: {
      heart: Heart,
      dumbbell: Dumbbell,
      pill: Pill,
      stethoscope: Stethoscope,
      activity: Activity,
      bandage: Bandage,
      brain: Brain,
      'heart-pulse': HeartPulse,
      hospital: Hospital,
    },
  },
  {
    label: 'Food & Drink',
    icons: {
      coffee: Coffee,
      utensils: Utensils,
      'shopping-cart': ShoppingCart,
      pizza: Pizza,
      cake: Cake,
      apple: Apple,
      carrot: Carrot,
      salad: Salad,
      beer: Beer,
      wine: Wine,
    },
  },
  {
    label: 'Travel',
    icons: {
      plane: Plane,
      car: Car,
      bike: Bike,
      'map-pin': MapPin,
      map: MapIcon,
      compass: Compass,
      bus: Bus,
      'train-front': TrainFront,
      luggage: Luggage,
    },
  },
  {
    label: 'Fun & Hobbies',
    icons: {
      music: Music,
      palette: Palette,
      camera: Camera,
      film: Film,
      'gamepad-2': Gamepad2,
      trophy: Trophy,
      guitar: Guitar,
      'party-popper': PartyPopper,
      gift: Gift,
      ticket: Ticket,
      headphones: Headphones,
    },
  },
  {
    label: 'People & Messages',
    icons: {
      user: User,
      baby: Baby,
      phone: Phone,
      mail: Mail,
      'message-circle': MessageCircle,
      users: Users,
      send: Send,
    },
  },
  {
    label: 'Nature & Animals',
    icons: {
      dog: Dog,
      cat: Cat,
      'tree-pine': TreePine,
      sun: Sun,
      moon: Moon,
      umbrella: Umbrella,
      leaf: Leaf,
      'flower-2': Flower2,
      'cloud-rain': CloudRain,
    },
  },
  {
    label: 'Money',
    icons: {
      wallet: Wallet,
      'credit-card': CreditCard,
      banknote: Banknote,
      'piggy-bank': PiggyBank,
      receipt: Receipt,
      coins: Coins,
      landmark: Landmark,
      'chart-line': ChartLine,
    },
  },
  {
    label: 'Tech',
    icons: {
      smartphone: Smartphone,
      watch: Watch,
      wifi: Wifi,
      battery: Battery,
      settings: Settings,
      zap: Zap,
    },
  },
];

export const ICONS: Record<string, LucideIcon> = ICON_GROUPS.reduce<Record<string, LucideIcon>>(
  (acc, group) => Object.assign(acc, group.icons),
  {},
);

export const ICON_NAMES = Object.keys(ICONS);

export function getIcon(name: string | null | undefined): LucideIcon | null {
  if (!name) return null;
  return ICONS[name] ?? null;
}

// A tiny synonym map for names that aren't the first word someone types —
// search (below) matches against the icon name OR any of its keywords.
// Deliberately small: only the non-obvious ones, not a tag for every icon.
export const ICON_KEYWORDS: Record<string, readonly string[]> = {
  dumbbell: ['gym', 'workout', 'fitness'],
  utensils: ['food', 'dinner', 'eat'],
  'shopping-cart': ['groceries', 'shop'],
  landmark: ['bank'],
  banknote: ['cash', 'money'],
  'piggy-bank': ['savings'],
  'credit-card': ['pay', 'bill'],
  'graduation-cap': ['school', 'exam'],
  'book-open': ['read', 'study'],
  briefcase: ['work', 'job'],
  stethoscope: ['doctor', 'medical'],
  pill: ['medicine', 'meds'],
  hospital: ['doctor', 'appointment'],
  'gamepad-2': ['game', 'play'],
  'tree-pine': ['nature', 'outdoors'],
  'washing-machine': ['laundry'],
  'trash-2': ['bin', 'garbage'],
  house: ['home'],
  'message-circle': ['chat', 'text'],
  'map-pin': ['location', 'place'],
  'party-popper': ['celebrate', 'birthday'],
  cake: ['birthday'],
  'train-front': ['commute', 'train'],
  bus: ['commute'],
  zap: ['energy', 'electric'],
  'alarm-clock': ['wake', 'alarm'],
};

export interface IconGroupNames {
  label: string;
  names: string[];
}

// Empty/whitespace query -> every group in full. Otherwise a case-insensitive
// substring match against the icon name or its keywords; groups with no
// match are dropped entirely rather than rendered empty.
export function searchIconGroups(query: string): IconGroupNames[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return ICON_GROUPS.map((group) => ({ label: group.label, names: Object.keys(group.icons) }));
  }

  const matches = (name: string) =>
    name.includes(q) || (ICON_KEYWORDS[name] ?? []).some((keyword) => keyword.includes(q));

  return ICON_GROUPS.map((group) => ({ label: group.label, names: Object.keys(group.icons).filter(matches) })).filter(
    (group) => group.names.length > 0,
  );
}

export type PickerItem =
  | { type: 'header'; key: string; label: string }
  | { type: 'row'; key: string; icons: string[] };

// Chunks each group's names into fixed-size rows, prefixed by a header item,
// so IconPicker can feed a single flat FlatList with headers interleaved
// between rows (numColumns can't do this on its own).
export function buildPickerItems(groups: IconGroupNames[], columns: number): PickerItem[] {
  const items: PickerItem[] = [];
  for (const group of groups) {
    items.push({ type: 'header', key: `h:${group.label}`, label: group.label });
    for (let i = 0; i < group.names.length; i += columns) {
      const rowIndex = i / columns;
      items.push({ type: 'row', key: `r:${group.label}:${rowIndex}`, icons: group.names.slice(i, i + columns) });
    }
  }
  return items;
}
