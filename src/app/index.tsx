import {
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { useEffect, useRef, useState } from 'react'
import * as Speech from 'expo-speech'
import { useDispatch, useGlobalState } from '@/src/state/AppContext'
import { checkFirstLaunch, removeValue } from '@/src/services/storageService'
import { Term } from '@/src/state/types'

export default function Index() {
  const dispatch = useDispatch()
  const state = useGlobalState()

  const [term, setTerm] = useState('')
  const [definition, setDefinition] = useState('')
  const definitionRef = useRef<TextInput>(null)
  const [termList, setTermList] = useState<Term[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [wordsLeft, setWordsLeft] = useState(0)

  useEffect(() => {
    checkFirstLaunch(dispatch).then()
  }, [])

  useEffect(() => {
    if (wordsLeft === 0 && isPlaying) startPlayback()
  }, [wordsLeft])

  useEffect(() => {
    if (state.stateLoaded && state.savedTermList) {
      setTermList(state.savedTermList)
    }
  }, [state.stateLoaded])

  const addNewPair = () => {
    let tempTermList: Term[]
    const {
      sourceLanguage = 'es', //todo remove optionality once language selection is in place
      targetLanguage = 'en',
      savedTermList,
    } = state
    let id = savedTermList?.length || 0
    let createdAt = Date.now()
    let modifiedAt = Date.now()
    let timesListened = 0
    let status = 'active' as 'active'
    let familiarity = 0
    tempTermList = [
      {
        id,
        term,
        definition,
        sourceLanguage,
        targetLanguage,
        createdAt,
        modifiedAt,
        timesListened,
        status,
        familiarity,
      },
      ...(savedTermList as []),
    ]
    setTermList(tempTermList)
    dispatch({
      type: 'updateSavedTermList',
      payload: { savedTermList: tempTermList },
    })
    setTerm('')
    setDefinition('')
  }
  //todo remove later
  const speak = (textToSpeak: string, language: string) => {
    Speech.speak(textToSpeak, { language })
  }

  const startPlayback = () => {
    setIsPlaying(true)
    setWordsLeft(termList.length)
    termList.map(
      ({ id, term, definition, sourceLanguage, targetLanguage }, index) => {
        Speech.speak(term, {
          language: sourceLanguage,
        })
        Speech.speak(definition, {
          language: targetLanguage,
          onDone: () => setWordsLeft(termList.length - index - 1),
        })
      },
    )
  }
  const stopPlayback = () => {
    setIsPlaying(false)
    Speech.stop()
  }

  const deletePair = (index: number) => {
    const newTermList = [...(state.savedTermList as [])]
    newTermList.splice(index, 1)
    setTermList(newTermList)
    dispatch({
      type: 'updateSavedTermList',
      payload: { savedTermList: newTermList },
    })
  }

  const Pair = ({
    term,
    definition,
    onDelete,
  }: {
    term: string
    definition: string
    onDelete: () => void
  }) => {
    return (
      <View style={styles.pair}>
        <View style={styles.textWrapper}>
          <TouchableOpacity onPress={() => speak(term, 'es')}>
            <Text style={styles.text}>{term}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => speak(definition, 'en')}>
            <Text style={styles.text}>{definition}</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onDelete}>
          <Text style={styles.delete}>Delete</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Autolearn</Text>
      </View>
      <TextInput
        placeholder="Term"
        value={term}
        onChangeText={(term) => setTerm(term)}
        style={styles.input}
        onSubmitEditing={() => definitionRef.current?.focus()}
      />
      <TextInput
        placeholder="Definition"
        value={definition}
        ref={definitionRef}
        onChangeText={(definition) => setDefinition(definition)}
        style={styles.input}
        onSubmitEditing={() => addNewPair()}
      />
      <ScrollView style={styles.terms}>
        {termList.map(({ term, definition }, index) => (
          <Pair
            key={index}
            term={term}
            definition={definition}
            onDelete={() => deletePair(index)}
          />
        ))}
      </ScrollView>
      <TouchableOpacity
        style={styles.testButton}
        onPress={() => console.log(state)}>
        <Text style={styles.delete}>Test</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.testButton}
        onPress={() => startPlayback()}>
        <Text style={styles.delete}>Play</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.testButton}
        disabled
        onPress={() => removeValue()}>
        <Text style={styles.delete}>Reset</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.testButton}
        onPress={() => stopPlayback()}>
        <Text style={styles.delete}>Pause</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  testButton: { margin: 8 },
  pair: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 8,
    margin: 8,
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
