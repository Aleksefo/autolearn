import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';

export function useTheme() {
  return Colors[useColorScheme()];
}
