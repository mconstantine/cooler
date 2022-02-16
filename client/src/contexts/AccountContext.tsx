import * as t from 'io-ts'
import { constVoid, flow, pipe } from 'fp-ts/function'
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useReducer
} from 'react'
import {
  foldAccountState,
  logoutAction,
  reducer,
  setLoginAction
} from './AccountContextState'
import { option, readerTaskEither } from 'fp-ts'
import { DateFromISOString, NonEmptyString } from 'io-ts-types'
import { EmailString, LocalizedString } from '../globalDomain'
import { makeRequest } from '../effects/api/useApi'
import { useStorage } from '../effects/useStorage'
import { IO } from 'fp-ts/IO'
import { FormData, LoginForm } from '../components/Form/Forms/LoginForm'
import { foldCoolerErrorType } from '../misc/Connection'
import { a18n } from '../a18n'
import { commonErrors } from '../misc/commonErrors'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { Option } from 'fp-ts/Option'

const LoginInput = t.type(
  {
    email: EmailString,
    password: NonEmptyString
  },
  'LoginInput'
)
type LoginInput = t.TypeOf<typeof LoginInput>

export const LoginOutput = t.type(
  {
    accessToken: NonEmptyString,
    refreshToken: NonEmptyString,
    expiration: DateFromISOString
  },
  'LoginOutput'
)
export type LoginOutput = t.TypeOf<typeof LoginOutput>

interface AccountContext {
  token: Option<LoginOutput>
  logout: IO<void>
}

const AccountContext = createContext<AccountContext>({
  token: option.none,
  logout: constVoid
})

export function useAccount() {
  return useContext(AccountContext)
}

export function AccountProvider(props: PropsWithChildren<{}>) {
  const [state, dispatch] = useReducer(reducer, { type: 'ANONYMOUS' })
  const { readStorage, writeStorage, clearStorage } = useStorage()

  const logout = () => {
    clearStorage('account')
    dispatch(logoutAction())
  }

  const loginCommand = (input: LoginInput) =>
    makeRequest(
      {
        method: 'POST',
        url: '/profile/login',
        inputCodec: LoginInput,
        outputCodec: LoginOutput
      },
      option.none,
      input
    )

  const login: ReaderTaskEither<FormData, LocalizedString, void> = pipe(
    loginCommand,
    readerTaskEither.bimap(
      flow(
        error => error.code,
        foldCoolerErrorType({
          COOLER_404: () => a18n`No accounts found with this email address.`,
          COOLER_400: () => a18n`The password is incorrect.`,
          COOLER_401: () => commonErrors.unexpected,
          COOLER_403: () => commonErrors.unexpected,
          COOLER_500: () => commonErrors.unexpected,
          COOLER_409: () => commonErrors.unexpected
        })
      ),
      response => {
        writeStorage('account', response)
        dispatch(setLoginAction(response))
      }
    )
  )

  useEffect(() => {
    pipe(
      readStorage('account'),
      option.fold(constVoid, token => dispatch(setLoginAction(token)))
    )
  }, [readStorage])

  const token: Option<LoginOutput> = pipe(
    state,
    foldAccountState({
      ANONYMOUS: () => option.none,
      LOGGED_IN: ({ token }) => option.some(token)
    })
  )

  return (
    <AccountContext.Provider value={{ token, logout }}>
      {pipe(
        state,
        foldAccountState({
          ANONYMOUS: () => <LoginForm onSubmit={login} />,
          LOGGED_IN: () => props.children
        })
      )}
    </AccountContext.Provider>
  )
}
