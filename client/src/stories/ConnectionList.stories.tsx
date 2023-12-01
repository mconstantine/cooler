import { Meta, StoryObj } from '@storybook/react'
import { boolean, nonEmptyArray, option, task, taskEither } from 'fp-ts'
import { Option } from 'fp-ts/Option'
import { unsafeLocalizedString } from '../a18n'
import { Content } from '../components/Content/Content'
import { ConnectionList } from '../components/ConnectionList/ConnectionList'
import { LocalizedString, unsafeNonNegativeInteger } from '../globalDomain'
import { ComponentProps, useState } from 'react'
import { Connection, unsafeCursor } from '../misc/Connection'
import { Item } from '../components/List/List'
import { constVoid, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Query } from '../effects/api/Query'
import { query } from '../effects/api/api'

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

interface ConnectionListStoryArgs
  extends ComponentProps<typeof ConnectionList> {
  actionLabel: LocalizedString
  shouldFail: boolean
}

const meta: Meta<ConnectionListStoryArgs> = {
  title: 'Cooler/ConnectionList',
  component: ConnectionList,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
    actionLabel: {
      name: 'Action label'
    },
    shouldFail: {
      name: 'Should fail',
      description: 'Set this to true to make searching fail',
      control: 'boolean'
    }
  }
}

export default meta
type Story = StoryObj<ConnectionListStoryArgs>

export const Default: Story = {
  render: function Story(props) {
    const [request, setRequest] = useState<
      Query<LocalizedString, Connection<FakeEntity>>
    >(query.loading())

    const { filter, loadMore } = useCreateConnection([...fakeEntities])

    const onQuerySearchChange = (queryString: string): void => {
      setRequest(query.loading())

      pipe(
        props.shouldFail,
        boolean.fold(
          () => {
            pipe(
              task.fromIO(() => filter(queryString)),
              task.delay(500),
              task => taskEither.fromTask(task),
              taskEither.chain(connection =>
                taskEither.fromIO(() => setRequest(query.right(connection)))
              )
            )()
          },
          () => setRequest(query.left(unsafeLocalizedString("I'm an error!")))
        )
      )
    }

    const onLoadMore: IO<void> = () => {
      setRequest(query.loading())

      pipe(
        task.fromIO(loadMore),
        task.delay(500),
        task => taskEither.fromTask(task),
        taskEither.chain(connection =>
          taskEither.fromIO(() => setRequest(query.right(connection)))
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
      <Content>
        <ConnectionList
          title={unsafeLocalizedString('Entities')}
          actions={option.some(
            nonEmptyArray.of({
              type: 'sync',
              label: props.actionLabel,
              icon: option.none,
              action: constVoid
            })
          )}
          query={request}
          onSearchQueryChange={option.some(onQuerySearchChange)}
          onLoadMore={option.some(onLoadMore)}
          renderListItem={renderListItem}
          emptyListMessage={unsafeLocalizedString('No entities found')}
        />
      </Content>
    )
  },
  args: {
    shouldFail: false,
    actionLabel: unsafeLocalizedString('Action')
  }
}

function useCreateConnection(allEntities: FakeEntity[]): {
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
    pageInfo: {
      totalCount: unsafeNonNegativeInteger(fakeEntities.length),
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
