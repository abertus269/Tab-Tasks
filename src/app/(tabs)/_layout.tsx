import { CalendarDays, ListTodo } from 'lucide-react-native';
import { Tabs } from 'expo-router';

import { colors } from '@/theme/tokens';
import { fonts, fontSize } from '@/theme/typography';

// DESIGN.md §7 — bottom tab bar, two tabs. Active tab: icon + label in
// accent-primary; inactive: text-secondary.
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentPrimary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.bgSurface,
          borderTopColor: colors.borderSubtle,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.bodyMedium,
          fontSize: fontSize.caption,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => <ListTodo color={color} size={size} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} strokeWidth={1.75} />,
        }}
      />
    </Tabs>
  );
}
