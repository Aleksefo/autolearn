import {
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import { useEffect, useRef, useState } from 'react'
import { useImmer } from 'use-immer'

import * as Speech from 'expo-speech'
import { useDispatch, useGlobalState } from '@/src/state/AppContext'
import { checkFirstLaunch, removeValue } from '@/src/services/storageService'
import { Pair } from '@/src/state/types'

export default function Index() {
  const dispatch = useDispatch()
  const state = useGlobalState()

  const [term, setTerm] = useState('')
  const [definition, setDefinition] = useState('')
  const definitionRef = useRef<TextInput>(null)
  const [pairList, updatePairList] = useImmer<Pair[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [wordsLeft, setWordsLeft] = useState(0)

  useEffect(() => {
    checkFirstLaunch(dispatch).then()
  }, [])

  useEffect(() => {
    if (wordsLeft === 0 && isPlaying) {
      startPlayback()
    }
  }, [wordsLeft])

  useEffect(() => {
    if (state.stateLoaded && state.savedPairList) {
      updatePairList(state.savedPairList)
    }
  }, [state.stateLoaded])

  const addNewPair = () => {
    let tempPairList: Pair[]
    const {
      sourceLanguage = 'es', //todo remove optionality once language selection is in place
      targetLanguage = 'en',
      savedPairList,
    } = state
    let id = savedPairList?.length || 0
    let createdAt = Date.now()
    let modifiedAt = Date.now()
    let timesListened = 0
    let status = 'active' as 'active'
    let familiarity = 0
    tempPairList = [
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
      ...(savedPairList as []),
    ]
    updatePairList(tempPairList)
    dispatch({
      type: 'updateSavedPairList',
      payload: { savedPairList: tempPairList },
    })
    setTerm('')
    setDefinition('')
  }

  //todo remove later
  const speak = (textToSpeak: string, language: string) => {
    Speech.speak(textToSpeak, { language })
  }

  const updateTimesListened = (id: number) => {
    updatePairList((draft) => {
      const pairList = draft.find((a) => a.id === id)
      pairList!.timesListened++
    })
  }

  const startPlayback = () => {
    setIsPlaying(true)
    setWordsLeft(pairList.length)
    pairList.map(
      (
        { id, term, definition, sourceLanguage, targetLanguage, timesListened },
        index,
      ) => {
        Speech.speak(term, {
          language: sourceLanguage,
          onDone: () => updateTimesListened(id),
        })
        Speech.speak(definition, {
          language: targetLanguage,
          onDone: () => setWordsLeft(pairList.length - index - 1),
        })
      },
    )
  }

  const stopPlayback = () => {
    setIsPlaying(false)
    dispatch({
      type: 'updateSavedPairList',
      payload: { savedPairList: pairList },
    })
    Speech.stop()
  }
  const randomizePairList = () => {
    let tempPairList: Pair[] = [...pairList]

    for (let i = tempPairList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[tempPairList[i], tempPairList[j]] = [tempPairList[j], tempPairList[i]]
    }
    updatePairList(tempPairList)
  }

  const deletePair = (index: number) => {
    const newPairList = [...(state.savedPairList as [])]
    newPairList.splice(index, 1)
    updatePairList(newPairList)
    dispatch({
      type: 'updateSavedPairList',
      payload: { savedPairList: newPairList },
    })
  }

  const Pair = ({
    term,
    definition,
    timesListened,
    onDelete,
  }: {
    term: string
    definition: string
    timesListened: number
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
        <Text>{timesListened}</Text>
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
        {pairList.map(({ term, definition, timesListened }, index) => (
          <Pair
            key={index}
            term={term}
            definition={definition}
            timesListened={timesListened}
            onDelete={() => deletePair(index)}
          />
        ))}
      </ScrollView>
      <TouchableOpacity
        style={styles.testButton}
        onPress={() => console.log(pairList)}>
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
      <TouchableOpacity
        style={styles.testButton}
        onPress={() => randomizePairList()}>
        <Text style={styles.delete}>shuffle</Text>
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
