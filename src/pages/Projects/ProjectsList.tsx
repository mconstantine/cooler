import { option } from 'fp-ts'
import { Reader } from 'fp-ts/Reader'
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
      action={option.none}
      onSearchQueryChange={onSearchQueryChange}
      renderListItem={renderProjectItem}
    />
  )
}
