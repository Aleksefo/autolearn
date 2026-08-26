import Ionicons from '@expo/vector-icons/Ionicons';
import { forwardRef } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

type ClearableInputProps = Omit<TextInputProps, 'style'> & {
  /** Styles the wrapper row (border, margins), not the inner TextInput. */
  style?: StyleProp<ViewStyle>;
};

// TextInput with a clear (×) button on both platforms. Vocabulary fields are
// foreign-language text, so autocorrect/autocapitalize are off by default —
// there is no cross-platform API to force a keyboard language.
export const ClearableInput = forwardRef<TextInput, ClearableInputProps>(
  function ClearableInput({ value, onChangeText, style, ...rest }, ref) {
    return (
      <View style={[styles.wrapper, style]}>
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          placeholderTextColor="#888"
          style={styles.input}
          {...rest}
        />
        {!!value && (
          <TouchableOpacity
            onPress={() => onChangeText?.('')}
            accessibilityLabel="Clear text"
            style={styles.clearButton}
          >
            <Ionicons name="close-circle" size={18} color="#888" />
          </TouchableOpacity>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#777',
    borderRadius: 8,
  },
  input: {
    flex: 1,
    padding: 8,
    color: '#111',
  },
  clearButton: {
    paddingHorizontal: 6,
  },
});
