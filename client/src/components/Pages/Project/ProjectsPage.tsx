import { pipe } from 'fp-ts/function'
import { Content } from '../../Content/Content'
import { Menu } from '../../Menu/Menu'
import { foldRouteSubject, RouteSubject } from '../../Router'
import NewProject from './NewProject'
import ProjectPage from './ProjectPage'
import ProjectsList from './ProjectsList'

interface Props {
  subject: RouteSubject
}

export default function ProjectsPage(props: Props) {
  return (
    <div className="ProjectsPage">
      <Menu />
      <Content>
        {pipe(
          props.subject,
          foldRouteSubject(
            () => <ProjectsList />,
            () => <NewProject />,
            id => <ProjectPage id={id} />
          )
        )}
      </Content>
    </div>
  )
}
