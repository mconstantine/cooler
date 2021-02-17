import { boolean, option, taskEither } from 'fp-ts'
import { constNull, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { TaskEither } from 'fp-ts/TaskEither'
import { refresh } from 'ionicons/icons'
import { Reducer, useReducer } from 'react'
import { a18n } from '../../a18n'
import { useDebounce } from '../../effects/useDebounce'
import { LocalizedString } from '../../globalDomain'
import { Connection, getConnectionNodes } from '../../misc/graphql'
import { Body } from '../Body/Body'
import { Buttons } from '../Button/Buttons/Buttons'
import { LoadingButton } from '../Button/LoadingButton/LoadingButton'
import { Input } from '../Form/Input/Input/Input'
import { Item, List } from '../List/List'
import { LoadingBlock } from '../Loading/LoadingBlock'
import { Panel } from '../Panel/Panel'

interface Props<T> {
  title: LocalizedString
  initialValue: Connection<T>
  renderListItem: (item: T) => Item
  onSearchQueryChange: ReaderTaskEither<string, LocalizedString, Connection<T>>
  onLoadMore: TaskEither<LocalizedString, Connection<T>>
}

interface IdleState<T> {
  type: 'idle'
  searchQuery: string
  connection: Option<Connection<T>>
}

interface LoadingState {
  type: 'loading'
  searchQuery: string
}

interface ErrorState {
  type: 'error'
  searchQuery: string
  error: LocalizedString
}

type State<T> = IdleState<T> | LoadingState | ErrorState

type Action<T> =
  | {
      type: 'searchInput'
      searchQuery: string
    }
  | {
      type: 'loading'
    }
  | {
      type: 'result'
      result: Connection<T>
    }
  | {
      type: 'error'
      error: LocalizedString
    }

function foldState<T, O>(
  whenIdle: (state: IdleState<T>) => O,
  whenLoading: (state: LoadingState) => O,
  whenError: (state: ErrorState) => O
): (state: State<T>) => O {
  return state => {
    switch (state.type) {
      case 'idle':
        return whenIdle(state)
      case 'loading':
        return whenLoading(state)
      case 'error':
        return whenError(state)
    }
  }
}

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (state.type) {
    case 'idle':
      switch (action.type) {
        case 'searchInput':
          return {
            type: 'idle',
            searchQuery: action.searchQuery,
            connection: state.connection
          }
        case 'loading':
          return {
            type: 'loading',
            searchQuery: state.searchQuery
          }
        case 'result':
        case 'error':
          return state
      }
    case 'loading':
      switch (action.type) {
        case 'result':
          return {
            type: 'idle',
            searchQuery: state.searchQuery,
            connection: option.some(action.result)
          }
        case 'error':
          return {
            type: 'error',
            searchQuery: state.searchQuery,
            error: action.error
          }
        case 'searchInput':
        case 'loading':
          return state
      }
    case 'error':
      switch (action.type) {
        case 'loading':
          return {
            type: 'loading',
            searchQuery: state.searchQuery
          }
        case 'searchInput':
          return {
            type: 'idle',
            searchQuery: action.searchQuery,
            connection: option.none
          }
        case 'result':
        case 'error':
          return state
      }
  }
}

export function ConnectionList<T>(props: Props<T>) {
  const [state, dispatch] = useReducer<Reducer<State<T>, Action<T>>>(reducer, {
    type: 'idle',
    searchQuery: '',
    connection: option.some(props.initialValue)
  })

  const debouncedSearch = useDebounce((query: string) => {
    dispatch({
      type: 'loading'
    })

    pipe(
      props.onSearchQueryChange(query),
      taskEither.bimap(
        error =>
          dispatch({
            type: 'error',
            error
          }),
        result =>
          dispatch({
            type: 'result',
            result
          })
      )
    )()
  })

  const onSearchQueryChange = (query: string) => {
    dispatch({
      type: 'searchInput',
      searchQuery: query
    })

    debouncedSearch(query)
  }

  const onLoadMore = pipe(
    taskEither.rightIO(() =>
      dispatch({
        type: 'loading'
      })
    ),
    taskEither.chain(() => props.onLoadMore),
    taskEither.bimap(
      error =>
        dispatch({
          type: 'error',
          error
        }),
      result =>
        dispatch({
          type: 'result',
          result
        })
    )
  )

  return (
    <Panel title={props.title} framed action={option.none}>
      <Input
        type="text"
        name="search"
        label={a18n`Search`}
        value={state.searchQuery}
        onChange={onSearchQueryChange}
        color={pipe(
          state,
          foldState(
            () => 'default',
            () => 'default',
            () => 'danger'
          )
        )}
        error={option.none}
        warning={option.none}
      />
      {pipe(
        state,
        foldState(
          state =>
            pipe(
              state.connection,
              option.fold(constNull, connection => (
                <>
                  <List
                    heading={option.none}
                    items={getConnectionNodes(connection).map(
                      props.renderListItem
                    )}
                  />
                  {pipe(
                    connection.pageInfo.hasNextPage,
                    boolean.fold(constNull, () => (
                      <Buttons>
                        <LoadingButton
                          type="button"
                          label={a18n`Load more`}
                          action={onLoadMore}
                          icon={refresh}
                        />
                      </Buttons>
                    ))
                  )}
                </>
              ))
            ),
          () => <LoadingBlock size="large" />,
          state => <Body color="danger">{state.error}</Body>
        )
      )}
    </Panel>
  )
}
