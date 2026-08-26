import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function EmptyState({
  onAddStarterPairs,
}: {
  onAddStarterPairs?: () => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Learn languages while you do other things
      </Text>
      <Text style={styles.body}>
        Add word pairs — a term in the language you are learning and its meaning
        in yours. Press play and Autolearn reads them aloud on repeat, so the
        vocabulary sinks in while you cook, commute, or work out.
      </Text>
      <Text style={styles.body}>
        Type a term and its definition above to add your first pair.
      </Text>
      {onAddStarterPairs && (
        <TouchableOpacity style={styles.button} onPress={onAddStarterPairs}>
          <Text style={styles.buttonText}>Add sample pairs</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#111',
  },
  body: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
