import {
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import React, { useEffect, useRef } from 'react'
import * as Speech from 'expo-speech'
import { useDispatch, useGlobalState } from '@/src/state/AppContext'
import {
  checkFirstLaunch,
  getAllKeys,
  removeValue,
} from '@/src/services/storageService'
import { Term } from '@/src/state/types'

export default function Index() {
  const dispatch = useDispatch()
  const state = useGlobalState()

  const [term, setTerm] = React.useState('')
  const [definition, setDefinition] = React.useState('')
  const definitionRef = useRef<TextInput>(null)
  const [termList, setTermList] = React.useState<Term[]>([])

  useEffect(() => {
    // removeValue()
    checkFirstLaunch(dispatch).then()
  }, [])

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
      type: 'saveNewPair',
      payload: { savedTermList: tempTermList },
    })
    setTerm('')
    setDefinition('')
  }

  const speak = (textToSpeak: string, language: string) => {
    Speech.speak(textToSpeak, { language })
  }

  const deletePair = (index: number) => {
    const newTermList = [...termList]
    newTermList.splice(index, 1)
    setTermList(newTermList)
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
        // ref={ref}
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
      <TouchableOpacity onPress={() => console.log(state)}>
        <Text style={styles.delete}>Test</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => getAllKeys()}>
        <Text style={styles.delete}>Test</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
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
