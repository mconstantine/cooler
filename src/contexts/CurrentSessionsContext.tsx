import * as t from 'io-ts'
import { Reader } from 'fp-ts/Reader'
import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { SessionWithTaskLabel } from '../entities/Session'
import {
  foldState,
  initialState,
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
  outputCodec: t.array(SessionWithTaskLabel)
})

interface CurrentSessionsContext {
  notifyStartedSession: Reader<SessionWithTaskLabel, void>
  notifyStoppedSession: Reader<SessionWithTaskLabel, void>
  currentSessions: Option<NonEmptyArray<SessionWithTaskLabel>>
}

const CurrentSessionsContext = createContext<CurrentSessionsContext>({
  notifyStartedSession: constVoid,
  notifyStoppedSession: constVoid,
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

  const notifyStartedSession: Reader<SessionWithTaskLabel, void> = session =>
    dispatch(notifyStartedSessionAction(session))

  const notifyStoppedSession: Reader<SessionWithTaskLabel, void> = session =>
    dispatch(notifyStoppedSessionAction(session))

  const currentSessions: Option<NonEmptyArray<SessionWithTaskLabel>> = pipe(
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
      value={{ notifyStartedSession, notifyStoppedSession, currentSessions }}
    >
      {props.children}
    </CurrentSessionsContext.Provider>
  )
}
