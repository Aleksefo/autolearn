import Ionicons from '@expo/vector-icons/Ionicons'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { Pair } from '@/src/state/types'

export function CollapsiblePair({
  pair,
  onDelete,
  onToggle,
  isOpen,
}: {
  pair: Pair
  onDelete: () => void
  onToggle: () => void
  isOpen: boolean
}) {
  return (
    <View style={styles.pairContainer}>
      <View style={styles.pair}>
        <View style={styles.textWrapper}>
          <Text style={styles.text}>{pair.term}</Text>
          <View style={{ backgroundColor: '#b1b1b1', height: 1 }} />
          <Text style={styles.text}>{pair.definition}</Text>
        </View>
        <TouchableOpacity
          style={styles.heading}
          onPress={onToggle}
          activeOpacity={0.8}>
          <Ionicons
            name={isOpen ? 'chevron-down' : 'chevron-forward-outline'}
            size={18}
          />
        </TouchableOpacity>
      </View>
      {isOpen && (
        <View style={styles.underPair}>
          <Text>{`Times listened: ${pair.timesListened}`}</Text>
          <TouchableOpacity onPress={onDelete}>
            <Ionicons name="trash-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>
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
  pairContainer: {},
  underPair: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pair: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 4,
    borderRadius: 8,
    marginVertical: 4,
    borderColor: '#686868',
    borderWidth: 1,
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
