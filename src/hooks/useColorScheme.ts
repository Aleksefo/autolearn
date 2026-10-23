import { useColorScheme as useSystemColorScheme } from 'react-native';

import { useAppStore } from '@/state/store';

/**
 * Color scheme resolved against the user's theme override in Settings.
 * 'system' follows the OS; anything else wins over it.
 */
export function useColorScheme(): 'light' | 'dark' {
  const themeSetting = useAppStore(state => state.theme);
  const systemScheme = useSystemColorScheme();

  if (themeSetting !== 'system') {
    return themeSetting;
  }

  return systemScheme === 'dark' ? 'dark' : 'light';
}
