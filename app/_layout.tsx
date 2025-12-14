import { Stack } from 'expo-router';
import { ThemeProvider } from '../src/context/ThemeContext';
import { LanguageProvider } from '../src/context/LanguageContext';
import { CartProvider } from '../src/context/CartContext';

export default function Layout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <CartProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </CartProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
