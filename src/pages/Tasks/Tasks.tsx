import { lazy } from 'react'
import { DependentEntitySubject } from '../../components/Router'
import { ObjectId } from '../../globalDomain'
import { TaskCreation } from './TaskCreation'

const Task = lazy(() => import('./Task'))

interface Props {
  project: ObjectId
  routeSubject: DependentEntitySubject
}

export default function Tasks(props: Props) {
  if (props.routeSubject === 'new') {
    return <TaskCreation project={props.project} />
  } else {
    return <Task _id={props.routeSubject} />
  }
}
