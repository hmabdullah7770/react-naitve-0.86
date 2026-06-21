import React, {createContext, useContext, useState} from 'react';
import {useColorScheme} from 'react-native';
import {colors} from './colors';

// 3 options exactly like WhatsApp
export const THEME_OPTIONS = {
  SYSTEM: 'system',
  LIGHT: 'light',
  DARK: 'dark',
};

const ThemeContext = createContext();

export function ThemeProvider({children}) {
  const systemScheme = useColorScheme(); // 'dark' | 'light'

  // Default is SYSTEM — follows device automatically
  const [selectedOption, setSelectedOption] = useState(THEME_OPTIONS.SYSTEM);

  // Resolve which colors to actually use
  const resolvedScheme =
    selectedOption === THEME_OPTIONS.SYSTEM
      ? systemScheme ?? 'light' // fallback if system returns null
      : selectedOption; // 'light' or 'dark' directly

  const theme = resolvedScheme === 'dark' ? colors.dark : colors.light;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: resolvedScheme === 'dark',
        selectedOption, // 'system' | 'light' | 'dark'
        setThemeOption: setSelectedOption, // call this from Settings
      }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
