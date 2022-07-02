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
  foldFormMode,
  initialState,
  logoutAction,
  reducer,
  refreshTokenAction,
  setFormModeAction,
  setLoginAction
} from './AccountContextState'
import { boolean, option, readerTaskEither, taskEither } from 'fp-ts'
import { DateFromISOString, NonEmptyString } from 'io-ts-types'
import { EmailString, LocalizedString } from '../globalDomain'
import { makeRequest, Request } from '../effects/api/useApi'
import { useStorage } from '../effects/useStorage'
import { IO } from 'fp-ts/IO'
import {
  FormData as LoginFormData,
  LoginForm
} from '../components/Form/Forms/LoginForm'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { Content } from '../components/Content/Content'
import { TaskEither } from 'fp-ts/TaskEither'
import {
  FormData as RegistrationFormData,
  RegistrationForm
} from '../components/Form/Forms/RegistrationForm'

const RegistrationInput = t.type(
  {
    name: NonEmptyString,
    email: EmailString,
    password: NonEmptyString
  },
  'RegistrationInput'
)
type RegistrationInput = t.TypeOf<typeof RegistrationInput>

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
  const [state, dispatch] = useReducer(reducer, initialState())
  const { readStorage, writeStorage, clearStorage } = useStorage()

  const onRegistrationLinkClick = () =>
    dispatch(setFormModeAction('Registration'))

  const onLoginButtonClick = () => dispatch(setFormModeAction('Login'))

  const logout = () => {
    clearStorage('account')
    dispatch(logoutAction())
  }

  const registrationCommand = (input: RegistrationInput) =>
    makeRequest(
      {
        method: 'POST',
        url: '/register',
        inputCodec: RegistrationInput,
        outputCodec: LoginOutput
      },
      option.none,
      input
    )

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

  const register: ReaderTaskEither<
    RegistrationFormData,
    LocalizedString,
    void
  > = pipe(
    registrationCommand,
    readerTaskEither.chain(response =>
      readerTaskEither.fromIO(() => {
        writeStorage('account', response)
        dispatch(setLoginAction(response))
      })
    )
  )

  const login: ReaderTaskEither<LoginFormData, LocalizedString, void> = pipe(
    loginCommand,
    readerTaskEither.chain(response =>
      readerTaskEither.fromIO(() => {
        writeStorage('account', response)
        dispatch(setLoginAction(response))
      })
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
        foldAccountState<ReactNode>({
          ANONYMOUS: state => (
            <Content>
              {pipe(
                state.formMode,
                foldFormMode({
                  Login: () => (
                    <LoginForm
                      onRegistrationLinkClick={onRegistrationLinkClick}
                      onSubmit={login}
                    />
                  ),
                  Registration: () => (
                    <RegistrationForm
                      onLoginLinkClick={onLoginButtonClick}
                      onSubmit={register}
                    />
                  )
                })
              )}
            </Content>
          ),
          LOGGED_IN: () => props.children
        })
      )}
    </AccountContext.Provider>
  )
}
