import { Meta, Story } from '@storybook/react'
import { boolean, nonEmptyArray, option, task, taskEither } from 'fp-ts'
import { Option } from 'fp-ts/Option'
import { unsafeLocalizedString } from '../a18n'
import { Content } from '../components/Content/Content'
import { ConnectionList as ConnectionListComponent } from '../components/ConnectionList/ConnectionList'
import { LocalizedString, unsafeNonNegativeInteger } from '../globalDomain'
import { CoolerStory } from './CoolerStory'
import { useState } from 'react'
import { Connection, unsafeCursor } from '../misc/graphql'
import { Item } from '../components/List/List'
import { pipe } from 'fp-ts/function'
import { UseQueryOutput } from '../effects/useQuery'
import { IO } from 'fp-ts/IO'
import { useCallback } from '@storybook/client-api'

interface Args {
  shouldFail: boolean
}

interface FakeEntity {
  id: number
  name: LocalizedString
  description: Option<LocalizedString>
}

const fakeEntities: FakeEntity[] = [
  {
    id: 0,
    name: unsafeLocalizedString('Corporis unde expedita veritatis nostrum'),
    description: option.some(
      unsafeLocalizedString(
        'Assumenda eaque dolores voluptas est magni ea repellendus quaerat ipsum aut ad aut consequatur quia'
      )
    )
  },
  {
    id: 1,
    name: unsafeLocalizedString('Odio et accusantium magni quis'),
    description: option.some(
      unsafeLocalizedString(
        'Laudantium ut inventore ut hic voluptatibus ut animi eos saepe hic facere incidunt eos voluptatem'
      )
    )
  },
  {
    id: 2,
    name: unsafeLocalizedString('Sint dolorem recusandae at modi'),
    description: option.some(
      unsafeLocalizedString(
        'Nesciunt sint neque perspiciatis qui vero nihil quo illum incidunt id praesentium corporis voluptatem est'
      )
    )
  },
  {
    id: 3,
    name: unsafeLocalizedString('Voluptatem dolor delectus est quia'),
    description: option.some(
      unsafeLocalizedString(
        'Odio praesentium repellat ut dolore voluptas et magni suscipit et aut aperiam nesciunt tenetur est'
      )
    )
  },
  {
    id: 4,
    name: unsafeLocalizedString('Quis autem eveniet autem illum'),
    description: option.some(
      unsafeLocalizedString(
        'Quis eum ullam delectus autem autem ut quam sint magnam odit veniam recusandae quos laudantium'
      )
    )
  },
  {
    id: 5,
    name: unsafeLocalizedString('Assumenda facere ipsa aliquid asperiores'),
    description: option.none
  },
  {
    id: 6,
    name: unsafeLocalizedString('Voluptatem aut nemo eos molestiae'),
    description: option.none
  },
  {
    id: 7,
    name: unsafeLocalizedString('Qui rerum aut cumque qui'),
    description: option.none
  },
  {
    id: 8,
    name: unsafeLocalizedString('Et omnis molestiae animi cumque'),
    description: option.none
  },
  {
    id: 9,
    name: unsafeLocalizedString('Fugit ipsum dignissimos error tempore'),
    description: option.none
  }
]

interface FakeQueryInput {
  query: string
}

interface FakeQueryData {
  connection: Connection<FakeEntity>
}

const ConnectionListTemplate: Story<Args> = props => {
  const [query, setQuery] = useState<
    UseQueryOutput<FakeQueryInput, FakeQueryData>['query']
  >({
    type: 'loading'
  })

  const { filter, loadMore } = useCreateConnection([...fakeEntities])

  const onQuerySearchChange = useCallback((query: string): void => {
    setQuery({ type: 'loading' })

    pipe(
      props.shouldFail,
      boolean.fold(
        () => {
          pipe(
            task.fromIO(() => filter(query)),
            task.delay(500),
            task => taskEither.fromTask(task),
            taskEither.chain(connection =>
              taskEither.fromIO(() =>
                setQuery({
                  type: 'success',
                  data: { connection }
                })
              )
            )
          )()
        },
        () =>
          setQuery({
            type: 'failed',
            error: {
              code: 'COOLER_500',
              message: unsafeLocalizedString("I'm an error!")
            }
          })
      )
    )
  }, [])

  const onLoadMore: IO<void> = () => {
    setQuery({ type: 'loading' })

    pipe(
      task.fromIO(loadMore),
      task.delay(500),
      task => taskEither.fromTask(task),
      taskEither.chain(connection =>
        taskEither.fromIO(() =>
          setQuery({
            type: 'success',
            data: { connection }
          })
        )
      )
    )()
  }

  const renderListItem = (entity: FakeEntity): Item => ({
    key: entity.id,
    type: 'readonly',
    label: option.some(unsafeLocalizedString('Entity')),
    content: entity.name,
    description: entity.description
  })

  return (
    <CoolerStory>
      <Content>
        <ConnectionListComponent
          title={unsafeLocalizedString('Entities')}
          query={query}
          extractConnection={data => data.connection}
          onSearchQueryChange={onQuerySearchChange}
          onLoadMore={onLoadMore}
          renderListItem={renderListItem}
        />
      </Content>
    </CoolerStory>
  )
}

function useCreateConnection(
  allEntities: FakeEntity[]
): {
  filter: (query: string) => Connection<FakeEntity>
  loadMore: () => Connection<FakeEntity>
} {
  const [entities, setEntitites] = useState(allEntities)

  const filter = (query: string): Connection<FakeEntity> => {
    const regex = new RegExp(query, 'i')
    const filteredEntities = fakeEntities.filter(entity =>
      regex.test(entity.name)
    )

    setEntitites(filteredEntities)

    return createConnection(
      filteredEntities.slice(0, 5),
      filteredEntities.length > 5
    )
  }

  const loadMore = () => createConnection(entities, false)

  return { filter, loadMore }
}

function createConnection(
  entities: FakeEntity[],
  hasNextPage: boolean
): Connection<FakeEntity> {
  return {
    totalCount: unsafeNonNegativeInteger(fakeEntities.length),
    pageInfo: {
      startCursor: pipe(
        entities,
        nonEmptyArray.fromArray,
        option.map(entities => unsafeCursor(entities[0].id.toString(10)))
      ),
      endCursor: pipe(
        entities,
        nonEmptyArray.fromArray,
        option.map(entities =>
          unsafeCursor(entities[entities.length - 1].id.toString(10))
        )
      ),
      hasPreviousPage: false,
      hasNextPage
    },
    edges: entities.map((entity, index) => ({
      cursor: unsafeCursor(index.toString(10)),
      node: entity
    }))
  }
}

export const ConnectionList = ConnectionListTemplate.bind({})

ConnectionList.args = {
  shouldFail: false
}

ConnectionList.argTypes = {
  shouldFail: {
    name: 'Should fail',
    description: 'Set this to true to make searching fail',
    control: 'boolean'
  }
}

const meta: Meta = {
  title: 'Cooler/Connection List'
}

export default meta
