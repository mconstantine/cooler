import { constVoid, pipe } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { DateFromISOString, NonEmptyString } from 'io-ts-types'
import {
  createContext,
  FC,
  Reducer,
  useContext,
  useEffect,
  useReducer
} from 'react'
import * as t from 'io-ts'
import { useStorage } from '../effects/useStorage'
import { option } from 'fp-ts'

const AnonymousAccount = t.type(
  {
    type: t.literal('anonymous')
  },
  'AnonymousAccount'
)
type AnonymousAccount = t.TypeOf<typeof AnonymousAccount>

const LoggedInAccount = t.type(
  {
    type: t.literal('loggedIn'),
    accessToken: NonEmptyString,
    refreshToken: NonEmptyString,
    expiration: DateFromISOString
  },
  'LoggedInAccount'
)
type LoggedInAccount = t.TypeOf<typeof LoggedInAccount>

export const Account = t.union([AnonymousAccount, LoggedInAccount], 'Account')
export type Account = t.TypeOf<typeof Account>

export function foldAccount<T>(
  whenAnonymous: (account: AnonymousAccount) => T,
  whenLoggedIn: (account: LoggedInAccount) => T
): (account: Account) => T {
  return state => {
    switch (state.type) {
      case 'anonymous':
        return whenAnonymous(state)
      case 'loggedIn':
        return whenLoggedIn(state)
    }
  }
}

type Action =
  | {
      type: 'login'
      accessToken: NonEmptyString
      refreshToken: NonEmptyString
      expiration: Date
    }
  | {
      type: 'refresh'
      accessToken: NonEmptyString
      refreshToken: NonEmptyString
      expiration: Date
    }
  | {
      type: 'logout'
    }

function reducer(state: Account, action: Action): Account {
  switch (state.type) {
    case 'anonymous':
      switch (action.type) {
        case 'login':
          return {
            ...action,
            type: 'loggedIn'
          }
        case 'refresh':
        case 'logout':
          return state
      }
    case 'loggedIn':
      switch (action.type) {
        case 'login':
          return state
        case 'refresh':
          return {
            ...action,
            type: 'loggedIn'
          }
        case 'logout':
          return {
            type: 'anonymous'
          }
      }
  }
}

interface AccountContext {
  account: Account
  dispatch: Reader<Action, void>
}

const AccountContext = createContext<AccountContext>({
  account: {
    type: 'anonymous'
  },
  dispatch: constVoid
})

export const AccountProvider: FC = props => {
  const { readStorage, writeStorage } = useStorage()

  const [state, dispatch] = useReducer<Reducer<Account, Action>>(
    reducer,
    pipe(
      readStorage('account'),
      option.getOrElse(() => ({ type: 'anonymous' } as Account))
    )
  )

  useEffect(() => {
    writeStorage('account', state)
  }, [state, writeStorage])

  return (
    <AccountContext.Provider value={{ account: state, dispatch }}>
      {props.children}
    </AccountContext.Provider>
  )
}

export function useAccount() {
  return useContext(AccountContext)
}
