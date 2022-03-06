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
  refreshTokenAction,
  setLoginAction
} from './AccountContextState'
import { boolean, option, readerTaskEither, taskEither } from 'fp-ts'
import { DateFromISOString, NonEmptyString } from 'io-ts-types'
import { EmailString, LocalizedString } from '../globalDomain'
import { CoolerError, makeRequest, Request } from '../effects/api/useApi'
import { useStorage } from '../effects/useStorage'
import { IO } from 'fp-ts/IO'
import { FormData, LoginForm } from '../components/Form/Forms/LoginForm'
import { foldCoolerErrorType } from '../misc/Connection'
import { a18n } from '../a18n'
import { commonErrors } from '../misc/commonErrors'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { Content } from '../components/Content/Content'
import { TaskEither } from 'fp-ts/TaskEither'

const LoginInput = t.type(
  {
    email: EmailString,
    password: NonEmptyString
  },
  'LoginInput'
)
type LoginInput = t.TypeOf<typeof LoginInput>

const RefreshTokenInput = t.type(
  {
    refreshToken: NonEmptyString
  },
  'RefreshTokenInput'
)

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
  withLogin: <I, II, O, OO>(
    request: Request<I, II, O, OO>,
    input: I
  ) => TaskEither<CoolerError, O>
  logout: IO<void>
}

const AccountContext = createContext<AccountContext>({
  withLogin: readerTaskEither.fromIO(constVoid) as () => TaskEither<
    CoolerError,
    never
  >,
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

  const refreshTokenCommand = (refreshToken: NonEmptyString) =>
    makeRequest(
      {
        method: 'POST',
        url: '/profile/refreshToken',
        inputCodec: RefreshTokenInput,
        outputCodec: LoginOutput
      },
      option.none,
      { refreshToken }
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

  const withLogin = <I, II, O, OO>(request: Request<I, II, O, OO>, input: I) =>
    pipe(
      state,
      foldAccountState({
        ANONYMOUS: () => {
          throw new Error('Called withLogin while anonymous.')
        },
        LOGGED_IN: state =>
          pipe(
            state.token.expiration.getTime() < Date.now(),
            boolean.fold(
              () => makeRequest(request, option.some(state.token), input),
              () =>
                pipe(
                  refreshTokenCommand(state.token.refreshToken),
                  taskEither.chain(response => {
                    writeStorage('account', response)
                    dispatch(refreshTokenAction(response))

                    return makeRequest(request, option.some(response), input)
                  })
                )
            )
          )
      })
    )

  useEffect(() => {
    pipe(
      readStorage('account'),
      option.fold(constVoid, token => dispatch(setLoginAction(token)))
    )
  }, [readStorage])

  return (
    <AccountContext.Provider value={{ withLogin, logout }}>
      {pipe(
        state,
        foldAccountState({
          ANONYMOUS: () => (
            <Content>
              <LoginForm onSubmit={login} />
            </Content>
          ),
          LOGGED_IN: () => props.children
        })
      )}
    </AccountContext.Provider>
  )
}
