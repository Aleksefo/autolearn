import {
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import React, { useRef } from 'react'

type IProject = { term: string; definition: string }

export default function Index() {
  const [term, setTerm] = React.useState('')
  const [definition, setDefinition] = React.useState('')
  const definitionRef = useRef(null)
  const [termList, setTermList] = React.useState<IProject[] | []>([])

  const addNewPair = () => {
    setTermList([{ term, definition }, ...termList])
  }

  const deleteTask = (index) => {
    const newTermList = [...termList]
    newTermList.splice(index, 1)
    setTermList(newTermList)
  }

  const Task = ({ term, definition, onDelete }) => {
    return (
      <View style={styles.task}>
        <View style={styles.textWrapper}>
          <Text style={styles.text}>{term}</Text>
          <Text style={styles.text}>{definition}</Text>
        </View>
        <TouchableOpacity onPress={onDelete}>
          <Text style={styles.delete}>Delete</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View
      style={{
        flex: 1,
        // justifyContent: "center",
        // alignItems: "center",
      }}>
      <TextInput
        placeholder="Term"
        value={term}
        // ref={ref}
        onChangeText={(term) => setTerm(term)}
        style={{ padding: 10 }}
        onSubmitEditing={() => definitionRef.current.focus()}
      />
      <TextInput
        placeholder="Definition"
        value={definition}
        ref={definitionRef}
        onChangeText={(definition) => setDefinition(definition)}
        style={{ padding: 10 }}
        onSubmitEditing={() => addNewPair()}
      />
      <ScrollView>
        {termList.map(({ term, definition }, index) => (
          <Task
            key={index}
            term={term}
            definition={definition}
            onDelete={() => deleteTask(index)}
          />
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  task: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 10,
    margin: 10,
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
})
