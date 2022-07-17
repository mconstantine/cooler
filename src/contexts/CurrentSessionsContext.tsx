import { Reader } from 'fp-ts/Reader'
import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { Session } from '../entities/Session'
import { IO } from 'fp-ts/IO'
import {
  foldState,
  initialState,
  notifyStartedSessionAction,
  reducer,
  RunningSession
} from './CurrentSessionsContextState'
import { createContext, PropsWithChildren, useContext, useReducer } from 'react'
import { Option } from 'fp-ts/Option'
import { constVoid, pipe } from 'fp-ts/function'
import { option } from 'fp-ts'

interface CurrentSessionsContext {
  notifyStartedSession: Reader<Session, void>
  notifyStoppedSession: Reader<Session, void>
  getCurrentSessions: IO<Option<NonEmptyArray<RunningSession>>>
}

const CurrentSessionsContext = createContext<CurrentSessionsContext>({
  notifyStartedSession: constVoid,
  notifyStoppedSession: constVoid,
  getCurrentSessions: () => option.none
})

export function useCurrentSessions() {
  return useContext(CurrentSessionsContext)
}

export function CurrentSessionsProvider(props: PropsWithChildren<{}>) {
  const [state, dispatch] = useReducer(reducer, initialState())

  const notifyStartedSession: Reader<Session, void> = session =>
    dispatch(notifyStartedSessionAction(session))

  const notifyStoppedSession: Reader<Session, void> = session =>
    dispatch(notifyStartedSessionAction(session))

  const getCurrentSessions: IO<Option<NonEmptyArray<RunningSession>>> = () =>
    pipe(
      state,
      foldState(
        () => option.none,
        ({ currentSessions }) => option.some(currentSessions)
      )
    )

  return (
    <CurrentSessionsContext.Provider
      value={{ notifyStartedSession, notifyStoppedSession, getCurrentSessions }}
    >
      {props.children}
    </CurrentSessionsContext.Provider>
  )
}
