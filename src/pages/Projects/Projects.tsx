import { lazy } from 'react'
import { RouteSubject } from '../../components/Router'

const ProjectsList = lazy(() => import('./ProjectsList'))
const Project = lazy(() => import('./Project'))
const ProjectCreation = lazy(() => import('./ProjectCreation'))

interface Props {
  routeSubject: RouteSubject
}

export default function Projects(props: Props) {
  if (props.routeSubject === 'all') {
    return <ProjectsList />
  } else if (props.routeSubject === 'new') {
    return <ProjectCreation />
  } else {
    return <Project _id={props.routeSubject} />
  }
}
