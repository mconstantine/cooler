import { boolean, option } from 'fp-ts'
import { constNull, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { refresh } from 'ionicons/icons'
import { useRef, useState } from 'react'
import { a18n } from '../../a18n'
import { useDebounce } from '../../effects/useDebounce'
import { LocalizedString } from '../../globalDomain'
import { Connection, getConnectionNodes } from '../../misc/Connection'
import { Body } from '../Body/Body'
import { Buttons } from '../Button/Buttons/Buttons'
import { Input } from '../Form/Input/Input/Input'
import { Item, List } from '../List/List'
import { LoadingBlock } from '../Loading/LoadingBlock'
import { Panel } from '../Panel/Panel'
import { useEffect } from 'react'
import { Button } from '../Button/Button/Button'
import { Option } from 'fp-ts/Option'
import { HeadingAction } from '../Heading/Heading'
import { Query } from '../../effects/api/Query'
import { query } from '../../effects/api/api'

interface Props<T> {
  title: LocalizedString
  action: Option<HeadingAction>
  query: Query<any, Connection<T>>
  renderListItem: Reader<T, Item>
  onSearchQueryChange: Reader<string, unknown>
  onLoadMore: IO<unknown>
}

export function ConnectionList<T>(props: Props<T>) {
  const [queryString, setQueryString] = useState('')
  const debouncedSearch = useDebounce(props.onSearchQueryChange)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    debouncedSearch(queryString)
  }, [queryString, debouncedSearch])

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  return (
    <Panel title={props.title} framed action={props.action}>
      <Input
        type="text"
        name="search"
        label={a18n`Search`}
        value={queryString}
        onChange={setQueryString}
        color={pipe(
          props.query,
          query.fold(
            () => 'default',
            () => 'default',
            () => 'danger'
          )
        )}
        error={option.none}
        warning={option.none}
        ref={searchInputRef}
      />
      {pipe(
        props.query,
        query.fold(
          () => <LoadingBlock size="large" />,
          error => <Body color="danger">{error.message}</Body>,
          connection => (
            <>
              <List
                heading={option.none}
                items={getConnectionNodes(connection).map(props.renderListItem)}
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
          )
        )
      )}
    </Panel>
  )
}
