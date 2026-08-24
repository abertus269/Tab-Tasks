import { getIcon } from '@/lib/icons';

interface Props {
  name: string | null | undefined;
  size?: number;
  color: string;
  strokeWidth?: number;
}

// A stable, statically-declared component wrapping the icon-name-to-component
// lookup, so call sites use a normal JSX tag instead of assigning a
// dynamically-resolved component to a local variable and rendering that.
export function DynamicIcon({ name, size = 20, color, strokeWidth = 1.75 }: Props) {
  const Icon = getIcon(name);
  if (!Icon) return null;
  // Resolving which icon to render by name is the entire point of this
  // component — there's no static alternative. Safe to suppress: Lucide
  // icons are stateless, so there's no state for a "new" identity to lose.
  // eslint-disable-next-line react-hooks/static-components
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}
