import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { LoginOutput } from './AccountContext'

type FormMode = 'Login' | 'Registration'

export function foldFormMode<T>(
  matches: Record<FormMode, IO<T>>
): Reader<FormMode, T> {
  return formMode => matches[formMode]()
}

interface AnonymousState {
  type: 'ANONYMOUS'
  formMode: FormMode
}

interface LoggedInState {
  type: 'LOGGED_IN'
  token: LoginOutput
}

type AccountState = AnonymousState | LoggedInState

export function initialState(): AnonymousState {
  return {
    type: 'ANONYMOUS',
    formMode: 'Login'
  }
}

export function foldAccountState<T>(cases: {
  [k in AccountState['type']]: Reader<Extract<AccountState, { type: k }>, T>
}): Reader<AccountState, T> {
  return accountState => cases[accountState.type](accountState as any)
}

interface SetFormModeAction {
  type: 'SET_FORM_MODE'
  formMode: FormMode
}

export function setFormModeAction(formMode: FormMode): SetFormModeAction {
  return {
    type: 'SET_FORM_MODE',
    formMode
  }
}

interface SetLoginAction {
  type: 'SET_LOGIN'
  token: LoginOutput
}

export function setLoginAction(token: LoginOutput): SetLoginAction {
  return {
    type: 'SET_LOGIN',
    token
  }
}

interface RefreshTokenAction {
  type: 'REFRESH_TOKEN'
  token: LoginOutput
}

export function refreshTokenAction(token: LoginOutput): RefreshTokenAction {
  return {
    type: 'REFRESH_TOKEN',
    token
  }
}

interface LogoutAction {
  type: 'LOGOUT'
}

export function logoutAction(): LogoutAction {
  return { type: 'LOGOUT' }
}

type AccountAction =
  | SetFormModeAction
  | SetLoginAction
  | RefreshTokenAction
  | LogoutAction

export function reducer(
  state: AccountState,
  action: AccountAction
): AccountState {
  switch (state.type) {
    case 'ANONYMOUS':
      switch (action.type) {
        case 'SET_FORM_MODE':
          return {
            type: 'ANONYMOUS',
            formMode: action.formMode
          }
        case 'SET_LOGIN':
          return {
            type: 'LOGGED_IN',
            token: action.token
          }
        case 'REFRESH_TOKEN':
        case 'LOGOUT':
          return state
      }
    case 'LOGGED_IN':
      switch (action.type) {
        case 'LOGOUT':
          return initialState()
        case 'REFRESH_TOKEN':
          return {
            ...state,
            token: action.token
          }
        case 'SET_FORM_MODE':
        case 'SET_LOGIN':
          return state
      }
  }
}
