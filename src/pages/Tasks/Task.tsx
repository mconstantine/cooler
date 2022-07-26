import { option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { TaskEither } from 'fp-ts/TaskEither'
import { Reader } from 'fp-ts/Reader'
import { useState } from 'react'
import { Session } from '../../entities/Session'
import { LocalizedString, ObjectId } from '../../globalDomain'
import { SessionPage } from './SessionData'
import { TaskPage } from './TaskPage'
import { usePost } from '../../effects/api/useApi'
import { startSessionRequest } from './domain'

interface Props {
  _id: ObjectId
}

interface TaskSubjectMode {
  type: 'task'
}

interface SessionSubjectMode {
  type: 'session'
  session: Session
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
  const [subjectMode, setSubjectMode] = useState<SubjectMode>({
    type: 'task'
  })

  const startSessionCommand = usePost(startSessionRequest)

  const onCreateSessionButtonClick: TaskEither<LocalizedString, void> = pipe(
    startSessionCommand({
      task: props._id,
      startTime: new Date(),
      endTime: option.none
    }),
    taskEither.chain(session =>
      taskEither.fromIO(() => {
        console.log('TODO: started session')
        console.log(session)
      })
    )
  )

  const onSessionListItemClick: Reader<Session, void> = session =>
    setSubjectMode({
      type: 'session',
      session
    })

  const backToTask: IO<void> = () =>
    setSubjectMode({
      type: 'task'
    })

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
          onDelete={backToTask}
        />
      )
    )
  )
}
