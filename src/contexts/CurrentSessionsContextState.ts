import { Reader } from 'fp-ts/Reader'
import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { ObjectId } from '../globalDomain'
import { Session } from '../entities/Session'
import { nonEmptyArray, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'

export interface RunningSession {
  _id: ObjectId
  task: ObjectId
  startTime: Date
}

interface EmptyState {
  type: 'empty'
}

interface RunningState {
  type: 'running'
  currentSessions: NonEmptyArray<RunningSession>
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

interface NotifyStartedSessionAction {
  type: 'notifyStartedSession'
  session: RunningSession
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

type Action = NotifyStartedSessionAction | NotifyStoppedSessionAction

export function reducer(state: State, action: Action): State {
  switch (state.type) {
    case 'empty':
      switch (action.type) {
        case 'notifyStartedSession':
          return {
            type: 'running',
            currentSessions: nonEmptyArray.of(action.session)
          }
        case 'notifyStoppedSession':
          return state
      }
    case 'running':
      switch (action.type) {
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
          return pipe(
            state.currentSessions.filter(
              session => session._id !== action.session._id
            ),
            nonEmptyArray.fromArray,
            option.fold<NonEmptyArray<RunningSession>, State>(
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
