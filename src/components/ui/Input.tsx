import { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { Radii, Spacing, TypeScale } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

export type InputProps = Pick<
  TextInputProps,
  | 'value'
  | 'onChangeText'
  | 'placeholder'
  | 'autoFocus'
  | 'maxLength'
  | 'returnKeyType'
  | 'onSubmitEditing'
  | 'autoCapitalize'
  | 'autoCorrect'
  | 'spellCheck'
  | 'keyboardType'
  | 'editable'
  | 'submitBehavior'
> & {
  label?: string;
  error?: string;
  /** Show a clear (×) button while the input has text. */
  clearable?: boolean;
};

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, editable = true, clearable = false, ...rest },
  ref,
) {
  const colors = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? colors.error
    : focused
      ? colors.primary
      : colors.border;

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="caption" color="textSecondary">
          {label}
        </Text>
      )}
      <View style={styles.row}>
        <TextInput
          {...rest}
          ref={ref}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            TypeScale.body,
            {
              backgroundColor: colors.backgroundElement,
              borderColor,
              color: colors.text,
              paddingRight:
                clearable && rest.value ? Spacing.six : Spacing.three,
            },
            !editable && styles.disabled,
          ]}
        />
        {clearable && !!rest.value && (
          <Pressable
            onPress={() => rest.onChangeText?.('')}
            accessibilityRole="button"
            accessibilityLabel="Clear text"
            hitSlop={8}
            style={styles.clearButton}
          >
            <Icon name="clear" size={18} color="textSecondary" />
          </Pressable>
        )}
      </View>
      {error && (
        <Text variant="caption" color="error">
          {error}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
    alignSelf: 'stretch',
  },
  row: {
    justifyContent: 'center',
  },
  input: {
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + Spacing.half,
    minHeight: 48,
  },
  clearButton: {
    position: 'absolute',
    right: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
