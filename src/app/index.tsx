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
import { CollapsiblePair } from '@/src/components/CollapsiblePair'

export default function Index() {
  const dispatch = useDispatch()
  const state = useGlobalState()

  const [term, setTerm] = useState('')
  const [definition, setDefinition] = useState('')
  const definitionRef = useRef<TextInput>(null)
  const [pairList, updatePairList] = useImmer<Pair[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [isTimed, setIsTimed] = useState(false)
  const [timeStarted, setTimeStarted] = useState(0)
  const [timer, setTimer] = useState(10)
  const [wordsLeft, setWordsLeft] = useState(0)

  useEffect(() => {
    checkFirstLaunch(dispatch).then()
  }, [])

  useEffect(() => {
    if (Date.now() >= timeStarted + 60000 * timer && isTimed) {
      stopPlayback()
    } else if (wordsLeft === 0 && isPlaying) {
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
    let createdAt = Date.now()
    let modifiedAt = Date.now()
    let timesListened = 0
    let status = 'active' as 'active'
    let familiarity = 0
    tempPairList = [
      {
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

  const updateTimesListened = (index: number) => {
    updatePairList((draft) => {
      const pairList = draft.find((a, i) => i === index)
      pairList!.timesListened++
    })
  }

  const startTimedPlayback = () => {
    setIsTimed(true)
    setTimeStarted(Date.now())
    startPlayback()
  }

  const startPlayback = () => {
    setIsPlaying(true)
    setWordsLeft(pairList.length)
    pairList.map(
      (
        { term, definition, sourceLanguage, targetLanguage, timesListened },
        index,
      ) => {
        Speech.speak(term, {
          language: sourceLanguage,
          onDone: () => updateTimesListened(index),
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
    setIsTimed(false)
    setTimeStarted(0)
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
        {pairList.map((pair, index) => (
          <CollapsiblePair
            key={index}
            onDelete={() => deletePair(index)}
            pair={pair}
          />
        ))}
      </ScrollView>
      <TouchableOpacity
        style={styles.testButton}
        onPress={() => console.log(pairList)}>
        <Text style={styles.delete}>Test</Text>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => startTimedPlayback()}>
          <Text style={styles.delete}>Play timed</Text>
        </TouchableOpacity>
        <TextInput
          placeholder="Timer"
          value={timer.toString()}
          keyboardType="number-pad"
          maxLength={4}
          onChangeText={(timer) => setTimer(Number(timer))}
        />
      </View>

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
