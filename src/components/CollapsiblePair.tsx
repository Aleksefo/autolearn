import Ionicons from '@expo/vector-icons/Ionicons'
import { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { ThemedView } from '@/components/ThemedView'
import { Pair } from '@/src/state/types'

export function CollapsiblePair({
  pair,
  onDelete,
}: {
  pair: Pair
  onDelete: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <View style={styles.pair}>
      <View style={styles.textWrapper}>
        <Text style={styles.text}>{pair.term}</Text>
        <Text style={styles.text}>{pair.definition}</Text>
      </View>
      <TouchableOpacity
        style={styles.heading}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}>
        <Ionicons
          name={isOpen ? 'chevron-down' : 'chevron-forward-outline'}
          size={18}
        />
      </TouchableOpacity>
      {isOpen && (
        <ThemedView style={styles.content}>
          <Text>{pair.timesListened}</Text>
          <TouchableOpacity onPress={onDelete}>
            <Text style={styles.delete}>Delete</Text>
          </TouchableOpacity>
        </ThemedView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  content: {
    marginTop: 6,
    marginLeft: 24,
  },
  testButton: { margin: 8 },
  pair: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 4,
    borderRadius: 8,
    marginVertical: 4,
  },
  textWrapper: {
    flex: 1,
  },
  text: {
    fontSize: 18,
  },
  delete: {
    color: 'red',
  },
  container: {
    flex: 1,
    padding: 8,
  },
  header: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#777',
    borderRadius: 8,
    padding: 8,
    margin: 8,
  },
  terms: {
    marginTop: 0,
  },
})
