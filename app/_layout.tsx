import { Stack } from 'expo-router';
import { ThemeProvider } from '../src/context/ThemeContext';
import { CartProvider } from '../src/context/CartContext';

export default function Layout() {
  return (
    <ThemeProvider>
      <CartProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </CartProvider>
    </ThemeProvider>
  );
}
