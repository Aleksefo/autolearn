import AsyncStorage from '@react-native-async-storage/async-storage'
import { initialState } from '@/src/state/initialState'
import { Dispatch } from 'react'
const appStateKey = 'appStateKey'
import { Action } from '../state/types'

export const checkFirstLaunch = async (dispatch: Dispatch<Action>) => {
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

export const mergeAppState = async (value: object) => {
  try {
    await AsyncStorage.mergeItem(appStateKey, JSON.stringify(value))

    const state = await AsyncStorage.getItem(appStateKey)
    if (__DEV__)
      console.log('storageService, mergeAppState', state && JSON.parse(state))
  } catch (e: any) {
    if (__DEV__)
      console.log('storageService, mergeAppState ERROR', JSON.parse(e))
  }
}

export const getAllKeys = async () => {
  let keys = ['']
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
