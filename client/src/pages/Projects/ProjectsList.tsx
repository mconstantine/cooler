import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { NonEmptyString } from 'io-ts-types'
import { useCallback, useState } from 'react'
import { a18n } from '../../a18n'
import { ConnectionList } from '../../components/ConnectionList/ConnectionList'
import { RoutedItem } from '../../components/List/List'
import { projectsRoute, useRouter } from '../../components/Router'
import { useGet } from '../../effects/api/useApi'
import { unsafePositiveInteger } from '../../globalDomain'
import { ConnectionQueryInput } from '../../misc/Connection'
import { getProjectsRequest, ProjectForList } from './domain'

export default function ProjectsList() {
  const [input, setInput] = useState<ConnectionQueryInput>({
    first: unsafePositiveInteger(20),
    name: option.none,
    after: option.none
  })

  const [projects] = useGet(getProjectsRequest, input)
  const { setRoute } = useRouter()

  const onSearchQueryChange: Reader<string, void> = useCallback(
    query =>
      pipe(query, NonEmptyString.decode, option.fromEither, name =>
        setInput(input => ({ ...input, name }))
      ),
    []
  )

  const renderProjectItem: Reader<ProjectForList, RoutedItem> = project => ({
    type: 'routed',
    key: project.id,
    label: option.some(project.client.name),
    content: project.name,
    description: project.description,
    action: () => setRoute(projectsRoute(project.id)),
    details: true
  })

  return (
    <ConnectionList
      query={projects}
      title={a18n`Projects`}
      onLoadMore={option.none}
      action={option.none}
      onSearchQueryChange={onSearchQueryChange}
      renderListItem={renderProjectItem}
    />
  )
}
