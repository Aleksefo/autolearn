import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { type ComponentProps } from 'react';

import { type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

// SF Symbols on iOS, Material Icons on Android/web — same pattern as
// UltimateAchiever's Icon component.
const ICONS = {
  settings: { sf: 'gearshape.fill', md: 'settings' },
  shuffle: { sf: 'shuffle', md: 'shuffle' },
  timer: { sf: 'timer', md: 'timer' },
  play: { sf: 'play.circle.fill', md: 'play-circle' },
  pause: { sf: 'pause.circle.fill', md: 'pause-circle' },
  stop: { sf: 'stop.circle.fill', md: 'stop-circle' },
  skipNext: { sf: 'forward.end.fill', md: 'skip-next' },
  chevronDown: { sf: 'chevron.down', md: 'keyboard-arrow-down' },
  chevronRight: { sf: 'chevron.right', md: 'chevron-right' },
  eye: { sf: 'eye.fill', md: 'visibility' },
  eyeOff: { sf: 'eye.slash.fill', md: 'visibility-off' },
  archive: { sf: 'graduationcap.fill', md: 'school' },
  undo: { sf: 'arrow.uturn.backward', md: 'undo' },
  swap: { sf: 'arrow.up.arrow.down', md: 'swap-vert' },
  edit: { sf: 'pencil', md: 'edit' },
  trash: { sf: 'trash.fill', md: 'delete' },
  clear: { sf: 'xmark.circle.fill', md: 'cancel' },
  star: { sf: 'star.fill', md: 'star' },
  starOutline: { sf: 'star', md: 'star-border' },
  sort: { sf: 'arrow.up.arrow.down', md: 'sort' },
} satisfies Record<
  string,
  { sf: SymbolViewProps['name']; md: MaterialIconName }
>;

export type IconName = keyof typeof ICONS;

export type IconProps = {
  name: IconName;
  size?: number;
  color?: ThemeColor;
};

export function Icon({ name, size = 24, color = 'text' }: IconProps) {
  const colors = useTheme();

  if (process.env.EXPO_OS === 'ios') {
    return (
      <SymbolView name={ICONS[name].sf} size={size} tintColor={colors[color]} />
    );
  }

  return (
    <MaterialIcons name={ICONS[name].md} size={size} color={colors[color]} />
  );
}
