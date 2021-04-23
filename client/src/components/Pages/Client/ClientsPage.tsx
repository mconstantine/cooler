import { pipe } from 'fp-ts/function'
import { lazy } from 'react'
import { Content } from '../../Content/Content'
import { Menu } from '../../Menu/Menu'
import { ClientSubject, foldClientSubject } from './domain'

const ClientsList = lazy(() => import('./ClientsList'))
const NewClient = lazy(() => import('./NewClient'))
const ClientData = lazy(() => import('./ClientData'))

interface Props {
  subject: ClientSubject
}

export default function ClientsPage(props: Props) {
  return (
    <div className="ClientsPage">
      <Menu />
      <Content>
        {pipe(
          props.subject,
          foldClientSubject(
            () => <ClientsList />,
            () => <NewClient />,
            id => <ClientData id={id} />
          )
        )}
      </Content>
    </div>
  )
}
