import { either, option } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { TaskEither } from 'fp-ts/TaskEither'
import { Reader } from 'fp-ts/Reader'
import { useState } from 'react'
import { SessionWithTaskLabel } from '../../entities/Session'
import { LocalizedString, ObjectId } from '../../globalDomain'
import { SessionData as SessionPage } from './SessionPage'
import { TaskPage } from './TaskPage'
import { usePost } from '../../effects/api/useApi'
import { startSessionRequest } from './domain'
import { useCurrentSessions } from '../../contexts/CurrentSessionsContext'
import { Either } from 'fp-ts/Either'

interface Props {
  _id: ObjectId
}

interface TaskSubjectMode {
  type: 'task'
}

interface SessionSubjectMode {
  type: 'session'
  session: SessionWithTaskLabel
}

type SubjectMode = TaskSubjectMode | SessionSubjectMode

function foldSubjectMode<T>(
  whenTask: Reader<TaskSubjectMode, T>,
  whenSession: Reader<SessionSubjectMode, T>
): Reader<SubjectMode, T> {
  return subjectMode => {
    switch (subjectMode.type) {
      case 'task':
        return whenTask(subjectMode)
      case 'session':
        return whenSession(subjectMode)
    }
  }
}

export default function Task(props: Props) {
  const { notifyStartedSession, notifyDeletedSession } = useCurrentSessions()

  const [subjectMode, setSubjectMode] = useState<SubjectMode>({
    type: 'task'
  })

  const startSessionCommand = usePost(startSessionRequest)

  // This is so ugly because we need to run `new Date()` when the function is called, not when it's
  // declared
  const onCreateSessionButtonClick: TaskEither<LocalizedString, void> = () =>
    new Promise<Either<LocalizedString, void>>(resolve =>
      startSessionCommand({
        task: props._id,
        startTime: new Date(),
        endTime: option.none
      })().then(
        either.fold(flow(either.left, resolve), session => {
          notifyStartedSession(session)
          resolve(either.right(void 0))
        })
      )
    )

  const onSessionListItemClick: Reader<SessionWithTaskLabel, void> = session =>
    setSubjectMode({
      type: 'session',
      session
    })

  const backToTask: IO<void> = () =>
    setSubjectMode({
      type: 'task'
    })

  const onDelete: Reader<SessionWithTaskLabel, void> = session => {
    notifyDeletedSession(session)
    backToTask()
  }

  return pipe(
    subjectMode,
    foldSubjectMode(
      () => (
        <TaskPage
          _id={props._id}
          onCreateSessionButtonClick={onCreateSessionButtonClick}
          onSessionListItemClick={onSessionListItemClick}
        />
      ),
      ({ session }) => (
        <SessionPage
          session={session}
          taskId={props._id}
          onCancel={backToTask}
          onUpdate={backToTask}
          onDelete={onDelete}
        />
      )
    )
  )
}
