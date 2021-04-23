import { pipe } from 'fp-ts/function'
import { lazy } from 'react'
import { Content } from '../../Content/Content'
import { Menu } from '../../Menu/Menu'
import { foldRouteSubject, RouteSubject } from '../../Router'

const ClientsList = lazy(() => import('./ClientsList'))
const NewClient = lazy(() => import('./NewClient'))
const ClientData = lazy(() => import('./ClientData'))

interface Props {
  subject: RouteSubject
}

export default function ClientsPage(props: Props) {
  return (
    <div className="ClientsPage">
      <Menu />
      <Content>
        {pipe(
          props.subject,
          foldRouteSubject(
            () => <ClientsList />,
            () => <NewClient />,
            id => <ClientData id={id} />
          )
        )}
      </Content>
    </div>
  )
}
