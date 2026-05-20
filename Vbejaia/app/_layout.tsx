import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>

        {/* START (entry point) */}
        <Stack.Screen
          name="start"
          options={{ headerShown: false }}
        />

        {/* LOGIN */}
        <Stack.Screen
          name="auth/login"
          options={{ headerShown: false }}
        />

        {/* MAIN APP */}
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false }}
        />

      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}