import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { NonEmptyString } from 'io-ts-types'
import { add } from 'ionicons/icons'
import { useCallback, useState } from 'react'
import { a18n } from '../../../a18n'
import { useConfig } from '../../../contexts/ConfigContext'
import { useQuery } from '../../../effects/useQuery'
import { unsafePositiveInteger } from '../../../globalDomain'
import { ConnectionQueryInput } from '../../../misc/graphql'
import { ConnectionList } from '../../ConnectionList/ConnectionList'
import { RoutedItem } from '../../List/List'
import { projectsRoute, useRouter } from '../../Router'
import { ProjectForList, projectsQuery } from './domain'

export default function ProjectsList() {
  const { entitiesPerPage } = useConfig()
  const [input, setInput] = useState<ConnectionQueryInput>({
    name: option.none,
    first: entitiesPerPage
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
        first: entitiesPerPage
      }),
    [entitiesPerPage]
  )

  const onLoadMore: IO<void> = () =>
    setInput(input => ({
      ...input,
      first: unsafePositiveInteger(input.first + entitiesPerPage)
    }))

  return (
    <ConnectionList
      title={a18n`Projects`}
      action={option.some({
        type: 'sync',
        label: a18n`New project`,
        icon: option.some(add),
        action: () => setRoute(projectsRoute('new'))
      })}
      query={query}
      extractConnection={({ projects }) => projects}
      renderListItem={renderListItem}
      onSearchQueryChange={onSearchQueryChange}
      onLoadMore={onLoadMore}
    />
  )
}
