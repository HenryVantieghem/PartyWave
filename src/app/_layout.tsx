import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

export default function RootLayout() {
  const { loadSession } = useAuthStore();
  const { theme } = useUIStore();

  // Load session on mount
  useEffect(() => {
    loadSession();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#0f1419' },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="party/[id]"
            options={{
              presentation: 'card',
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="party/create"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="camera/preview"
            options={{
              presentation: 'fullScreenModal',
              animation: 'fade',
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
