import { nonEmptyArray, option } from 'fp-ts'
import { constNull, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { a18n, unsafeLocalizedString } from '../../a18n'
import { List, RoutedItem } from '../../components/List/List'
import { Panel } from '../../components/Panel/Panel'
import { projectsRoute, useRouter } from '../../components/Router'
import { query } from '../../effects/api/api'
import { useGet } from '../../effects/api/useApi'
import { Project } from '../../entities/Project'
import { makeGetNextProjectQuery, makeGetPreviousProjectQuery } from './domain'
import { Query } from '../../effects/api/Query'
import { LocalizedString } from '../../globalDomain'

interface Props {
  project: Project
}

export function ProjectSiblings(props: Props) {
  const { setRoute } = useRouter()

  const [previousProject] = useGet(
    makeGetPreviousProjectQuery(props.project._id)
  )

  const [nextProject] = useGet(makeGetNextProjectQuery(props.project._id))

  const makeProjectItem = (
    label: LocalizedString,
    q: Query<LocalizedString, Project>
  ): Option<NonEmptyArray<RoutedItem>> =>
    pipe(
      q,
      query.fold(
        () => option.none,
        () => option.none,
        project =>
          option.some<RoutedItem>({
            key: project._id,
            type: 'routed',
            label: option.some(label),
            content: project.name,
            description: option.some(project.client.name),
            action: _ => setRoute(projectsRoute(project._id), _),
            details: true
          })
      ),
      option.map(nonEmptyArray.of)
    )

  const previousProjectListItem = makeProjectItem(
    a18n`Previous project`,
    previousProject
  )
  const nextProjectListItem = makeProjectItem(a18n`Next project`, nextProject)

  const listItems: Option<NonEmptyArray<RoutedItem>> = pipe(
    previousProjectListItem,
    option.fold(
      () => nextProjectListItem,
      previousProjectListItem =>
        pipe(
          nextProjectListItem,
          option.fold(
            () => option.some(previousProjectListItem),
            nextProjectListItem =>
              pipe(
                previousProjectListItem,
                nonEmptyArray.concat(nextProjectListItem),
                option.some
              )
          )
        )
    )
  )

  return (
    <Panel framed actions={option.none}>
      {pipe(
        listItems,
        option.fold(constNull, listItems => (
          <List
            heading={option.none}
            emptyListMessage={unsafeLocalizedString('')}
            items={listItems}
          />
        ))
      )}
    </Panel>
  )
}
