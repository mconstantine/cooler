import * as t from 'io-ts'
import { constVoid, pipe } from 'fp-ts/function'
import {
  createContext,
  PropsWithChildren,
  ReactNode,
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
import { makeRequest, Request } from '../effects/api/useApi'
import { useStorage } from '../effects/useStorage'
import { IO } from 'fp-ts/IO'
import { FormData, LoginForm } from '../components/Form/Forms/LoginForm'
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
  ) => TaskEither<LocalizedString, O>
  logout: IO<void>
}

const AccountContext = createContext<AccountContext>({
  withLogin: readerTaskEither.fromIO(constVoid) as () => TaskEither<
    LocalizedString,
    never
  >,
  logout: constVoid
})

export function useAccount() {
  return useContext(AccountContext)
}

export function AccountProvider(props: PropsWithChildren) {
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
        url: '/login',
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
        url: '/refresh-token',
        inputCodec: RefreshTokenInput,
        outputCodec: LoginOutput
      },
      option.none,
      { refreshToken }
    )

  const login: ReaderTaskEither<FormData, LocalizedString, void> = pipe(
    loginCommand,
    readerTaskEither.map(response => {
      writeStorage('account', response)
      dispatch(setLoginAction(response))
    })
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
        foldAccountState<ReactNode>({
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
