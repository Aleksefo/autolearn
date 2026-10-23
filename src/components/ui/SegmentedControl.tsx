import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type Segment<T extends string> = {
  value: T;
  label: string;
};

export type SegmentedControlProps<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const colors = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.track, { backgroundColor: colors.backgroundElement }]}
    >
      {segments.map(segment => {
        const isSelected = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(segment.value)}
            style={[
              styles.segment,
              isSelected && [
                styles.selected,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ],
            ]}
          >
            <Text
              variant={isSelected ? 'bodyBold' : 'body'}
              color={isSelected ? 'text' : 'textSecondary'}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: Radii.full,
    padding: Spacing.half + 1,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radii.full,
  },
  selected: {
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 1,
  },
});
