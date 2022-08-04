import { lazy } from 'react'
import { RouteSubject } from '../../components/Router'

const ClientsList = lazy(() => import('./ClientsList'))
const Client = lazy(() => import('./Client'))
const ClientCreation = lazy(() => import('./ClientCreation'))

interface Props {
  routeSubject: RouteSubject
}

export default function Clients(props: Props) {
  if (props.routeSubject === 'all') {
    return <ClientsList />
  } else if (props.routeSubject === 'new') {
    return <ClientCreation />
  } else {
    return <Client _id={props.routeSubject} />
  }
}
