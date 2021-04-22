import { boolean, option } from 'fp-ts'
import { constNull, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { refresh } from 'ionicons/icons'
import { useState } from 'react'
import { a18n } from '../../a18n'
import { useDebounce } from '../../effects/useDebounce'
import { foldQuery, UseQueryOutput } from '../../effects/useQuery'
import { LocalizedString } from '../../globalDomain'
import { Connection, getConnectionNodes } from '../../misc/graphql'
import { Body } from '../Body/Body'
import { Buttons } from '../Button/Buttons/Buttons'
import { Input } from '../Form/Input/Input/Input'
import { Item, List } from '../List/List'
import { LoadingBlock } from '../Loading/LoadingBlock'
import { Panel } from '../Panel/Panel'
import { useEffect } from 'react'
import { Button } from '../Button/Button/Button'

interface Props<T, O> {
  title: LocalizedString
  query: UseQueryOutput<any, O>['query']
  extractConnection: Reader<O, Connection<T>>
  renderListItem: (item: T) => Item
  onSearchQueryChange: Reader<string, unknown>
  onLoadMore: IO<unknown>
}

export function ConnectionList<T, O>(props: Props<T, O>) {
  const [query, setQuery] = useState('')

  const debouncedSearch = useDebounce((query: string) => {
    props.onSearchQueryChange(query)
  })

  useEffect(() => {
    debouncedSearch(query)
  }, [query])

  return (
    <Panel title={props.title} framed action={option.none}>
      <Input
        type="text"
        name="search"
        label={a18n`Search`}
        value={query}
        onChange={setQuery}
        color={pipe(
          props.query,
          foldQuery(
            () => 'default',
            () => 'default',
            () => 'danger'
          )
        )}
        error={option.none}
        warning={option.none}
      />
      {pipe(
        props.query,
        foldQuery(
          () => <LoadingBlock size="large" />,
          error => <Body color="danger">{error.message}</Body>,
          data =>
            pipe(props.extractConnection(data), connection => (
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
                      <Button
                        type="button"
                        label={a18n`Load more`}
                        action={props.onLoadMore}
                        icon={option.some(refresh)}
                      />
                    </Buttons>
                  ))
                )}
              </>
            ))
        )
      )}
    </Panel>
  )
}
