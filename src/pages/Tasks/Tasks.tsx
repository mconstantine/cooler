import { lazy } from 'react'
import { RouteSubject } from '../../components/Router'

const Task = lazy(() => import('./Task'))

interface Props {
  routeSubject: RouteSubject
}

export default function Tasks(props: Props) {
  if (props.routeSubject === 'all') {
    return null
  } else if (props.routeSubject === 'new') {
    return null
  } else {
    return <Task _id={props.routeSubject} />
  }
}
