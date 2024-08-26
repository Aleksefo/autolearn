export interface State {
  savedTermList?: {
    id: number
    term: string
    definition: string
    sourceLanguage: string
    targetLanguage: string
    createdAt: number
    modifiedAt: number
    timesListened: number
    status: 'active' | 'inactive'
    familiarity: number
  }[]
  sourceLanguage: string
  targetLanguage: string
  // counterStatus: 'stopped' | 'started' | 'paused'
  // setsTime: number[]
  // totalRounds: number
  // currentRound: number
  // totalSets: number
  // currentSet: number
  // timeSession: number
  // timeSessionLeft: number
  // totalTimeLeft: number
  stateLoaded?: boolean
  // volumeState: 'on' | 'vibro' | 'off'
  // themeState: 'light' | 'dark'
  // theme: {
  //   primary
  //   accent
  //   error
  //   success
  //   text
  //   grey1
  //   grey2
  //   grey3
  //   grey4
  //   background
  //   backgroundSet1
  //   backgroundSet2
  //   backgroundSet3
  //   backgroundSet4
  //   backgroundPaused
  //   white
  // }
}

export type Action =
  // | {
  //     type: 'resetData'
  //   }
  // | {
  //     type: 'increaseCurrentSet'
  //   }
  // | {
  //     type: 'resetCurrentSet'
  //   }
  // | {
  //     type: 'increaseCurrentRound'
  //   }
  // | {
  //     type: 'setTimeSession'
  //     payload: {
  //       time: number
  //     }
  //   }
  // | {
  //     type: 'setTimeSessionLeft'
  //     payload: {
  //       timeSessionLeft: number
  //     }
  //   }
  // | {
  //     type: 'changeStatus'
  //     payload: {
  //       command: 'start' | 'pause' | 'resume' | 'stop'
  //     }
  //   }
  // | {
  //     type: 'calculateTotalTime'
  //   }
  // | {
  //     type: 'updateTotalTime'
  //   }
  // | {
  //     type: 'changeSetAmount'
  //     payload: {
  //       amount: number
  //     }
  //   }
  // | {
  //     type: 'changeSetDuration'
  //     payload: {
  //       setNumber: number
  //       duration: number
  //     }
  //   }
  // | {
  //     type: 'changeRoundsAmount'
  //     payload: {
  //       amount: number
  //     }
  //   }
  | {
      type: 'loadStoredState'
      payload: {
        state: State
      }
    }
  | {
      type: 'saveNewPair'
      payload: {
        term: string
        definition: string
      }
    }
// | {
//     type: 'changeVolumeState'
//   }
// | {
//     type: 'changeThemeState'
//   }
