import AsyncStorage from '@react-native-async-storage/async-storage'
import { initialState } from '@/src/state/initialState'
const appStateKey = 'appStateKey'

export const checkFirstLaunch = async ({ dispatch }) => {
  // const dispatch = useDispatch()
  try {
    const savedState = await AsyncStorage.getItem(appStateKey)
    if (savedState === null) {
      dispatch({
        type: 'loadStoredState',
        payload: { state: {} },
      })
      await AsyncStorage.setItem(appStateKey, JSON.stringify(initialState))
    } else {
      console.log(savedState)
      dispatch({
        type: 'loadStoredState',
        payload: { state: JSON.parse(savedState) },
      })
      // dispatch({
      //   type: 'calculateTotalTime',
      // })
      // dispatch({
      //   type: 'resetData',
      // })
    }
  } catch (error) {
    if (__DEV__) console.log('retrieveData error ' + error)
  }
}

export const mergeAppState = async (value) => {
  console.log('merging', value)
  try {
    await AsyncStorage.mergeItem(appStateKey, JSON.stringify(value))

    const state = await AsyncStorage.getItem(appStateKey)
    if (__DEV__) console.log('storageService, mergeAppState', JSON.parse(state))
  } catch (e) {
    if (__DEV__)
      console.log('storageService, mergeAppState ERROR', JSON.parse(e))
  }
}

export const getAllKeys = async () => {
  let keys = []
  try {
    const savedState = await AsyncStorage.getItem(appStateKey)
    console.log(savedState)

    // keys = await AsyncStorage.getAllKeys()
  } catch (e) {
    // read key error
  }
  if (__DEV__) console.log(keys)
}
export const removeValue = async () => {
  try {
    await AsyncStorage.removeItem(appStateKey)
  } catch (e) {
    // remove error
  }
  if (__DEV__) console.log('storageService, removeValue')
}
