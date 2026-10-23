import { Switch as RNSwitch } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export function Switch({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const colors = useTheme();

  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      trackColor={{
        false: colors.backgroundSelected,
        true: colors.primary,
      }}
      thumbColor={colors.onPrimary}
    />
  );
}
