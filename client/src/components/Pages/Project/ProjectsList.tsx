import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { NonEmptyString } from 'io-ts-types'
import { useCallback, useState } from 'react'
import { a18n } from '../../../a18n'
import { useQuery } from '../../../effects/useQuery'
import { unsafePositiveInteger } from '../../../globalDomain'
import { ConnectionQueryInput } from '../../../misc/graphql'
import { ConnectionList } from '../../ConnectionList/ConnectionList'
import { RoutedItem } from '../../List/List'
import { projectsRoute, useRouter } from '../../Router'
import { ProjectForList, projectsQuery } from './domain'

const projectsPerPage = unsafePositiveInteger(20)

export default function ProjectsList() {
  const [input, setInput] = useState<ConnectionQueryInput>({
    name: option.none,
    first: projectsPerPage
  })

  const { setRoute } = useRouter()
  const { query } = useQuery(projectsQuery, input)

  const renderListItem = (project: ProjectForList): RoutedItem => ({
    key: project.id,
    type: 'routed',
    details: true,
    label: option.some(project.client.name),
    content: project.name,
    description: project.description,
    action: () => setRoute(projectsRoute(project.id))
  })

  const onSearchQueryChange: Reader<string, void> = useCallback(
    query =>
      setInput({
        name: pipe(query, NonEmptyString.decode, option.fromEither),
        first: projectsPerPage
      }),
    []
  )

  const onLoadMore: IO<void> = () =>
    setInput(input => ({
      ...input,
      first: unsafePositiveInteger(input.first + projectsPerPage)
    }))

  return (
    <ConnectionList
      title={a18n`Projects`}
      action={option.none}
      query={query}
      extractConnection={({ projects }) => projects}
      renderListItem={renderListItem}
      onSearchQueryChange={onSearchQueryChange}
      onLoadMore={onLoadMore}
    />
  )
}
