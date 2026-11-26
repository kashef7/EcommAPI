import { isDarkMode, toggleTheme } from '@/core/theme/theme';

export function useAuthTheme() {
  return {
    isDark: isDarkMode.value,
    toggleTheme,
  };
}
