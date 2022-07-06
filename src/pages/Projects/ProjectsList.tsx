import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { NonEmptyString } from 'io-ts-types'
import { useState } from 'react'
import { a18n } from '../../a18n'
import { ConnectionList } from '../../components/ConnectionList/ConnectionList'
import { RoutedItem } from '../../components/List/List'
import { projectsRoute, useRouter } from '../../components/Router'
import { useGet } from '../../effects/api/useApi'
import { Project } from '../../entities/Project'
import { unsafePositiveInteger } from '../../globalDomain'
import { ConnectionQueryInput } from '../../misc/Connection'
import { getProjectsRequest } from './domain'

export default function ProjectsList() {
  const [input, setInput] = useState<ConnectionQueryInput>({
    query: option.none,
    first: unsafePositiveInteger(20),
    after: option.none
  })

  const [projects] = useGet(getProjectsRequest, input)
  const { setRoute } = useRouter()

  const onSearchQueryChange: Reader<string, void> = query =>
    pipe(query, NonEmptyString.decode, option.fromEither, name =>
      setInput(input => ({ ...input, name }))
    )

  const renderProjectItem: Reader<Project, RoutedItem> = project => ({
    type: 'routed',
    key: project._id,
    // FIXME:
    // label: option.some(project.client.name),
    label: option.none,
    content: project.name,
    description: project.description,
    action: () => setRoute(projectsRoute(project._id)),
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
