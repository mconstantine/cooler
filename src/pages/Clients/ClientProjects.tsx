import { option } from 'fp-ts'
import { Reader } from 'fp-ts/Reader'
import { a18n } from '../../a18n'
import { ConnectionList } from '../../components/ConnectionList/ConnectionList'
import { RoutedItem } from '../../components/List/List'
import { projectsRoute, useRouter } from '../../components/Router'
import { useConnection } from '../../effects/useConnection'
import { Project } from '../../entities/Project'
import { ObjectId } from '../../globalDomain'
import { makeClientProjectsQuery } from './domain'

interface Props {
  clientId: ObjectId
}

export function ClientProjects(props: Props) {
  const { setRoute } = useRouter()

  const { results, onSearchQueryChange, onLoadMore } = useConnection(
    makeClientProjectsQuery(props.clientId),
    'ASC'
  )

  const renderItem: Reader<Project, RoutedItem> = project => ({
    key: project._id,
    type: 'routed',
    label: option.none,
    content: project.name,
    description: project.description,
    action: () => setRoute(projectsRoute(project._id)),
    details: true
  })

  return (
    <ConnectionList
      title={a18n`Projects`}
      query={results}
      onSearchQueryChange={option.some(onSearchQueryChange)}
      action={option.none}
      onLoadMore={option.some(onLoadMore)}
      renderListItem={renderItem}
      emptyListMessage={a18n`No projects found`}
    />
  )
}
