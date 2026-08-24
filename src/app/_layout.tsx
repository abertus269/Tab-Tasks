import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { db, dbReady } from '@/db/client';
import { seedIfEmpty } from '@/db/seed';
import migrations from '@/drizzle/migrations';
import { initNotifications } from '@/lib/notifications';
import { colors } from '@/theme/tokens';
import { fontModules } from '@/theme/typography';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // db (and useMigrations below) must not be touched until dbReady resolves —
  // on web it's populated asynchronously (see src/db/client.ts).
  const [isDbReady, setIsDbReady] = useState(false);
  useEffect(() => {
    dbReady.then(() => setIsDbReady(true));
  }, []);

  if (!isDbReady) {
    return null;
  }

  return <RootLayoutContent />;
}

function RootLayoutContent() {
  const [fontsLoaded] = useFonts(fontModules);
  const { success: migrationsSuccess, error: migrationError } = useMigrations(db, migrations);
  const ready = fontsLoaded && migrationsSuccess;

  useEffect(() => {
    if (migrationsSuccess) {
      seedIfEmpty();
      // Only sets up the notification channel/handler — never requests
      // permission here. That happens the moment the user first turns a
      // reminder on (task-form.tsx), not on cold launch.
      initNotifications();
    }
  }, [migrationsSuccess]);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (migrationError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Database error: {migrationError.message}</Text>
      </View>
    );
  }

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="task-form" options={{ presentation: 'modal' }} />
          <Stack.Screen name="category-manager" options={{ presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgBase,
    padding: 24,
  },
  errorText: {
    color: colors.danger,
    textAlign: 'center',
  },
});
