import { set, uniqueId } from 'lodash'
import { BN, unlimitedAllowance } from '../../utils'
import Selectors from '../../utils/selectors'

export const errors = {
  login: {
    NOT_UNLOCKED: 'Please unlock your Ethereum wallet before logging in'
  }
}

export const initialState = {
  public: {},
  private: {},
  admin: {},
  error: {},
  intents: {},
  network: {
    loading: true,
    connected: false,
    error: null
  },
  web3: {}
}

// Actions are either handled by AsyncHandlers or reducer
export const actions = {
  unlockWallet: () => actionGenerator('UNLOCK_WALLET'),
  login: () => actionGenerator('LOGIN'),
  logout: () => actionGenerator('LOGOUT'),
  update: (path, data) => actionGenerator('UPDATE', { path, data }),
  approve: () => actionGenerator('APPROVE'),
  deposit: amount => actionGenerator('DEPOSIT', { amount }),
  withdraw: amount => actionGenerator('WITHDRAW', { amount }),
  error: (intent, message) => actionGenerator('ERROR', { [intent]: message })
}

function actionGenerator (type, params, resp) {
  return {
    id: uniqueId(),
    type,
    params,
    resp
  }
}

export function reducer (state, action) {
  switch (action.type) {
    case 'UPDATE':
      console.log(action.params.path, action.params.data)
      return { ...set(state, action.params.path, action.params.data) }
    case 'ERROR': {
      return { ...state, error: action.params }
    }
    default:
      throw new Error(`Reducer does not handle ${action.type}`)
  }
}

function AsyncHandlers (libs = {}) {
  return {
    UNLOCK_WALLET: async action => {
      if (libs.web3.active) return true
      await libs.web3.setConnector('MetaMask', { suppressAndThrowErrors: true })
    },
    LOGIN: async action => {
      if (!libs.web3.active || !libs.web3.account) {
        libs.dispatch(actions.error('login', errors.login.NOT_UNLOCKED))
      }
      let signed
      let token
      let resp
      try {
        token = await libs.socket.call('auth')('token')
        signed = await libs.web3.library
          .getSigner()
          .signMessage('2100 Login: ' + token)
        resp = await libs.socket.call('auth')(
          'authenticate',
          signed,
          libs.web3.account
        )
      } catch (e) {
        console.log(action.type, e.message)
        return libs.dispatch(actions.error(action.type, e.message))
      }
      // libs.web3.account

      console.log('LOGIN RESP', resp)
    },
    LOGOUT: async action => {
      console.log(action.type)
      const resp = await libs.socket.call('auth')('unauthenticate')
      console.log('LOGOUT RESP', resp)
    },
    APPROVE: async action => {
      const { dai, controller } = Selectors(libs.state)
      let resp = {}
      try {
        resp = await dai.contract.approve(
          controller.contract.address,
          unlimitedAllowance
        )
      } catch (e) {
        console.log(action.type, e.message)
        libs.dispatch(actions.error(action.type, e.message))
      }
      return resp
    },
    DEPOSIT: async action => {
      const { controller } = Selectors(libs.state)
      let resp = {}
      try {
        resp = await controller.contract.deposit(action.params.amount)
      } catch (e) {
        console.log(action.type, e.message)
        libs.dispatch(actions.error(action.type, e.message))
      }
      return resp
    },
    WITHDRAW: async action => {
      const { controller } = Selectors(libs.state)
      let resp = {}
      try {
        resp = await controller.contract.withdraw(action.params.amount)
      } catch (e) {
        console.log(action.type, e.message)
        libs.dispatch(actions.error(action.type, e.message))
      }
      return resp
    }
  }
}

export default function Dispatcher (libs) {
  const asyncHandlers = AsyncHandlers(libs)
  return async action => {
    if (!action) return
    if (asyncHandlers[action.type]) return asyncHandlers[action.type](action)
    libs.dispatch(action)
  }
}