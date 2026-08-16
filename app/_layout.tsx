import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Slot, router } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useThemeStore } from '../src/stores/theme.store';
import { useAuthStore } from '../src/stores/auth.store';
import { useEffect } from 'react';
import { useColorScheme } from 'nativewind';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { listenToProfile } from '../src/services/firestore.service';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

import { cssInterop } from 'nativewind';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated from 'react-native-reanimated';

// Register 3rd party components to prevent NativeWind from throwing printUpgradeWarning (which crashes Expo Router context)
cssInterop(SafeAreaView, { className: 'style' });
cssInterop(BlurView, { className: 'style' });

// Register Reanimated components
cssInterop(Animated.View, { className: 'style' });
cssInterop(Animated.Text, { className: 'style' });
cssInterop(Animated.Image, { className: 'style' });
cssInterop(Animated.ScrollView, { className: 'style', contentContainerClassName: 'contentContainerStyle' });

const queryClient = new QueryClient();

export default function RootLayout() {
  const { user, hasHydrated, logout, rehydrateUser, syncProfile } = useAuthStore();
  const theme = useThemeStore(state => state.theme);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    if (!hasHydrated) return;
    rehydrateUser();
  }, [hasHydrated, rehydrateUser]);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = listenToProfile(
      user.uid,
      syncProfile,
      () => {
        // Document deleted by admin
        logout();
        router.replace('/(auth)/login');
      },
      (error) => {
        // Permission denied (e.g., auth token revoked or expired)
        if (error.code === 'permission-denied') {
          logout();
          router.replace('/(auth)/login');
        }
      }
    );

    return () => unsubscribe();
  }, [user?.uid, logout, syncProfile]);

  useEffect(() => {
    if (theme === 'SYSTEM') {
      setColorScheme('system');
    } else if (theme === 'LIGHT') {
      setColorScheme('light');
    } else if (theme === 'DARK') {
      setColorScheme('dark');
    }
  }, [theme, setColorScheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style={theme === 'DARK' ? 'light' : theme === 'LIGHT' ? 'dark' : 'auto'} />
          <BottomSheetModalProvider>
            <Slot />
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
