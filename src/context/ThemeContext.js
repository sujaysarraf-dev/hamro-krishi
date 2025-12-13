import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const systemColorScheme = useColorScheme();
    const [theme, setTheme] = useState('system'); // 'light', 'dark', or 'system'
    const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

    useEffect(() => {
        loadThemePreference();
    }, []);

    useEffect(() => {
        // Update theme when system preference changes (if theme is set to 'system')
        if (theme === 'system') {
            setIsDark(systemColorScheme === 'dark');
        }
    }, [systemColorScheme, theme]);

    const loadThemePreference = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme_preference');
            if (savedTheme) {
                setTheme(savedTheme);
                if (savedTheme === 'system') {
                    setIsDark(systemColorScheme === 'dark');
                } else {
                    setIsDark(savedTheme === 'dark');
                }
            } else {
                // Default to system theme
                setTheme('system');
                setIsDark(systemColorScheme === 'dark');
            }
        } catch (error) {
            console.error('Error loading theme preference:', error);
            setTheme('system');
            setIsDark(systemColorScheme === 'dark');
        }
    };

    const setThemePreference = async (newTheme) => {
        try {
            setTheme(newTheme);
            await AsyncStorage.setItem('theme_preference', newTheme);
            
            if (newTheme === 'system') {
                setIsDark(systemColorScheme === 'dark');
            } else {
                setIsDark(newTheme === 'dark');
            }
        } catch (error) {
            console.error('Error saving theme preference:', error);
        }
    };

    const colors = {
        light: {
            background: '#FFFFFF',
            surface: '#F5F5F5',
            text: '#1F1F1F',
            textSecondary: '#666666',
            border: '#E0E0E0',
            primary: '#228B22',
            error: '#FF4444',
            success: '#228B22',
            warning: '#FFA500',
            card: '#FFFFFF',
            header: '#FFFFFF',
        },
        dark: {
            background: '#121212',
            surface: '#1E1E1E',
            text: '#FFFFFF',
            textSecondary: '#B0B0B0',
            border: '#333333',
            primary: '#4CAF50',
            error: '#FF6B6B',
            success: '#4CAF50',
            warning: '#FFB74D',
            card: '#1E1E1E',
            header: '#1E1E1E',
        },
    };

    const currentColors = isDark ? colors.dark : colors.light;

    return (
        <ThemeContext.Provider
            value={{
                theme,
                isDark,
                colors: currentColors,
                setTheme: setThemePreference,
            }}
        >
            {children}
        </ThemeContext.Provider>
    );
};

