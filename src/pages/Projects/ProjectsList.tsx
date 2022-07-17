import { option } from 'fp-ts'
import { Reader } from 'fp-ts/Reader'
import { add } from 'ionicons/icons'
import { a18n } from '../../a18n'
import { ConnectionList } from '../../components/ConnectionList/ConnectionList'
import { RoutedItem } from '../../components/List/List'
import { projectsRoute, useRouter } from '../../components/Router'
import { useConnection } from '../../effects/useConnection'
import { Project } from '../../entities/Project'
import { getProjectsRequest } from './domain'

export default function ProjectsList() {
  const { setRoute } = useRouter()
  const {
    results: projects,
    onSearchQueryChange,
    onLoadMore
  } = useConnection(getProjectsRequest, 'ASC')

  const renderProjectItem: Reader<Project, RoutedItem> = project => ({
    type: 'routed',
    key: project._id,
    label: option.some(project.client.name),
    content: project.name,
    description: project.description,
    action: () => setRoute(projectsRoute(project._id)),
    details: true
  })

  return (
    <ConnectionList
      query={projects}
      title={a18n`Projects`}
      onLoadMore={option.some(onLoadMore)}
      action={option.some({
        type: 'sync',
        label: a18n`Create new project`,
        icon: option.some(add),
        action: () => setRoute(projectsRoute('new'))
      })}
      onSearchQueryChange={option.some(onSearchQueryChange)}
      renderListItem={renderProjectItem}
      emptyListMessage={a18n`No projects found`}
    />
  )
}
