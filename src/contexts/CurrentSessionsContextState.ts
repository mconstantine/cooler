import { Reader } from 'fp-ts/Reader'
import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { Session } from '../entities/Session'
import { nonEmptyArray, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'

interface EmptyState {
  type: 'empty'
}

interface RunningState {
  type: 'running'
  currentSessions: NonEmptyArray<Session>
}

type State = EmptyState | RunningState

export function initialState(): EmptyState {
  return {
    type: 'empty'
  }
}

export function foldState<T>(
  whenEmpty: Reader<EmptyState, T>,
  whenRunning: Reader<RunningState, T>
): Reader<State, T> {
  return state => {
    switch (state.type) {
      case 'empty':
        return whenEmpty(state)
      case 'running':
        return whenRunning(state)
    }
  }
}

interface NotifySessionsFromServerAction {
  type: 'notifySessionsFromServer'
  sessions: NonEmptyArray<Session>
}

export function notifySessionsFromServerAction(
  sessions: NonEmptyArray<Session>
): NotifySessionsFromServerAction {
  return {
    type: 'notifySessionsFromServer',
    sessions
  }
}

interface NotifyStartedSessionAction {
  type: 'notifyStartedSession'
  session: Session
}

export function notifyStartedSessionAction(
  session: Session
): NotifyStartedSessionAction {
  if (option.isSome(session.endTime)) {
    throw new Error(
      'Trying to notify a started session that has already stopped'
    )
  }

  return {
    type: 'notifyStartedSession',
    session
  }
}

interface NotifyStoppedSessionAction {
  type: 'notifyStoppedSession'
  session: Session
}

export function notifyStoppedSessionAction(
  session: Session
): NotifyStoppedSessionAction {
  if (option.isNone(session.endTime)) {
    throw new Error("Trying to notify a stopped session that isn't stopped")
  }

  return {
    type: 'notifyStoppedSession',
    session
  }
}

interface NotifyDeletedSessionAction {
  type: 'notifyDeletedSession'
  session: Session
}

export function notifyDeletedSessionAction(
  session: Session
): NotifyDeletedSessionAction {
  return {
    type: 'notifyDeletedSession',
    session
  }
}

type Action =
  | NotifySessionsFromServerAction
  | NotifyStartedSessionAction
  | NotifyStoppedSessionAction
  | NotifyDeletedSessionAction

export function reducer(state: State, action: Action): State {
  switch (state.type) {
    case 'empty':
      switch (action.type) {
        case 'notifySessionsFromServer':
          return {
            type: 'running',
            currentSessions: action.sessions
          }
        case 'notifyStartedSession':
          return {
            type: 'running',
            currentSessions: nonEmptyArray.of(action.session)
          }
        case 'notifyStoppedSession':
          return state
        case 'notifyDeletedSession':
          return state
      }
    case 'running':
      switch (action.type) {
        case 'notifySessionsFromServer':
          return state
        case 'notifyStartedSession':
          return {
            ...state,
            currentSessions: pipe(
              state.currentSessions.find(
                session => session._id === action.session._id
              ),
              option.fromNullable,
              option.fold(
                () =>
                  nonEmptyArray.concat(state.currentSessions)([action.session]),
                () => state.currentSessions
              )
            )
          }
        case 'notifyStoppedSession':
        case 'notifyDeletedSession':
          return pipe(
            state.currentSessions.filter(
              session => session._id !== action.session._id
            ),
            nonEmptyArray.fromArray,
            option.fold<NonEmptyArray<Session>, State>(
              () => ({ type: 'empty' }),
              currentSessions => ({
                type: 'running',
                currentSessions
              })
            )
          )
      }
  }
}
