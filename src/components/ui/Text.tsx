import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import {
  Fonts,
  TypeScale,
  type TextVariant,
  type ThemeColor,
} from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: ThemeColor;
};

export function Text({
  variant = 'body',
  color = 'text',
  style,
  ...rest
}: TextProps) {
  const colors = useTheme();

  return (
    <RNText
      style={[
        TypeScale[variant],
        {
          color: colors[color],
          fontFamily: variant === 'code' ? Fonts?.mono : Fonts?.sans,
        },
        style,
      ]}
      {...rest}
    />
  );
}
