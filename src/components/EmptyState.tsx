import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export function EmptyState({
  onAddStarterPairs,
}: {
  onAddStarterPairs?: () => void;
}) {
  const colors = useTheme();

  return (
    <View style={styles.base}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primaryMuted }]}>
        <Icon name="play" size={32} color="primary" />
      </View>
      <Text variant="heading" style={styles.centered}>
        Learn languages while you do other things
      </Text>
      <Text color="textSecondary" style={styles.centered}>
        Add word pairs — a term in the language you are learning and its meaning
        in yours. Press play and Autolearn reads them aloud on repeat, so the
        vocabulary sinks in while you cook, commute, or work out.
      </Text>
      <Text color="textSecondary" style={styles.centered}>
        Type a term and its definition above to add your first pair.
      </Text>
      {onAddStarterPairs && (
        <Button
          title="Add sample pairs"
          onPress={onAddStarterPairs}
          style={styles.action}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.five,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  centered: {
    textAlign: 'center',
  },
  action: {
    marginTop: Spacing.three,
  },
});
