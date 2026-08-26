import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function OptionChips<T extends string | number>({
  options,
  selected,
  onSelect,
}: {
  options: { label: string; value: T }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.row}>
      {options.map(option => {
        const isSelected = option.value === selected;
        return (
          <TouchableOpacity
            key={String(option.value)}
            onPress={() => onSelect(option.value)}
            style={[styles.chip, isSelected && styles.chipSelected]}
            accessibilityLabel={option.label}
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              style={[styles.chipText, isSelected && styles.chipTextSelected]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  chipSelected: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  chipText: {
    color: '#333',
    fontSize: 13,
  },
  chipTextSelected: {
    color: '#fff',
  },
});
