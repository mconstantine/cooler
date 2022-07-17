import { pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { useState } from 'react'
import { Session } from '../../entities/Session'
import { ObjectId } from '../../globalDomain'
import { SessionPage } from './SessionPage'
import { TaskPage } from './TaskPage'

interface Props {
  _id: ObjectId
}

interface TaskSubjectMode {
  type: 'task'
  taskId: ObjectId
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
    type: 'task',
    taskId: props._id
  })

  const onSessionListItemClick: Reader<Session, void> = session =>
    setSubjectMode({
      type: 'session',
      session
    })

  const backToTask: IO<void> = () =>
    setSubjectMode({
      type: 'task',
      taskId: props._id
    })

  return pipe(
    subjectMode,
    foldSubjectMode(
      ({ taskId }) => (
        <TaskPage
          _id={taskId}
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
