import * as t from 'io-ts'
import { Reader } from 'fp-ts/Reader'
import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { Session } from '../entities/Session'
import {
  foldState,
  initialState,
  notifyDeletedSessionAction,
  notifySessionsFromServerAction,
  notifyStartedSessionAction,
  notifyStoppedSessionAction,
  reducer
} from './CurrentSessionsContextState'
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useReducer
} from 'react'
import { Option } from 'fp-ts/Option'
import { constVoid, flow, pipe } from 'fp-ts/function'
import { nonEmptyArray, option } from 'fp-ts'
import { makeGetRequest, useReactiveCommand } from '../effects/api/useApi'
import { query } from '../effects/api/api'

const getOpenSessionsRequest = makeGetRequest({
  url: '/sessions/open',
  inputCodec: t.void,
  outputCodec: t.array(Session)
})

interface CurrentSessionsContext {
  notifyStartedSession: Reader<Session, void>
  notifyStoppedSession: Reader<Session, void>
  notifyDeletedSession: Reader<Session, void>
  currentSessions: Option<NonEmptyArray<Session>>
}

const CurrentSessionsContext = createContext<CurrentSessionsContext>({
  notifyStartedSession: constVoid,
  notifyStoppedSession: constVoid,
  notifyDeletedSession: constVoid,
  currentSessions: option.none
})

export function useCurrentSessions() {
  return useContext(CurrentSessionsContext)
}

export function CurrentSessionsProvider(props: PropsWithChildren<{}>) {
  const [state, dispatch] = useReducer(reducer, initialState())

  const [openSessions, , fetchOpenSessionsCommand] = useReactiveCommand(
    getOpenSessionsRequest
  )

  const notifyStartedSession: Reader<Session, void> = session =>
    dispatch(notifyStartedSessionAction(session))

  const notifyStoppedSession: Reader<Session, void> = session =>
    dispatch(notifyStoppedSessionAction(session))

  const notifyDeletedSession: Reader<Session, void> = session =>
    dispatch(notifyDeletedSessionAction(session))

  const currentSessions: Option<NonEmptyArray<Session>> = pipe(
    state,
    foldState(
      () => option.none,
      ({ currentSessions }) => option.some(currentSessions)
    )
  )

  useEffect(() => {
    const fetchOpenSessions = fetchOpenSessionsCommand()
    fetchOpenSessions()
  }, [fetchOpenSessionsCommand])

  useEffect(() => {
    pipe(
      openSessions,
      query.fold(
        constVoid,
        constVoid,
        flow(
          nonEmptyArray.fromArray,
          option.fold(constVoid, flow(notifySessionsFromServerAction, dispatch))
        )
      )
    )
  }, [openSessions])

  return (
    <CurrentSessionsContext.Provider
      value={{
        notifyStartedSession,
        notifyStoppedSession,
        notifyDeletedSession,
        currentSessions
      }}
    >
      {props.children}
    </CurrentSessionsContext.Provider>
  )
}
