import { boolean, option } from 'fp-ts'
import { constNull, constVoid, pipe } from 'fp-ts/function'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'
import { refresh } from 'ionicons/icons'
import { PropsWithChildren, useRef, useState } from 'react'
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
import { NonEmptyArray } from 'fp-ts/NonEmptyArray'

interface Props<T> extends PropsWithChildren {
  title: LocalizedString
  actions: Option<NonEmptyArray<HeadingAction>>
  query: Query<LocalizedString, Connection<T>>
  renderListItem: Reader<T, Item>
  onSearchQueryChange: Option<Reader<string, unknown>>
  onLoadMore: Option<IO<unknown>>
  emptyListMessage: LocalizedString
  autoFocus?: boolean
  inputLabel?: LocalizedString
}

export function ConnectionList<T>(props: Props<T>) {
  const autoFocus = props.autoFocus ?? true
  const inputLabel = props.inputLabel || a18n`Search`
  const [queryString, setQueryString] = useState('')

  const debouncedSearch = useDebounce(
    pipe(
      props.onSearchQueryChange,
      option.getOrElse<Reader<string, void>>(() => constVoid)
    )
  )

  const searchInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    debouncedSearch(queryString)
  }, [queryString, debouncedSearch])

  useEffect(() => {
    autoFocus && searchInputRef.current?.focus()
  }, [autoFocus])

  return (
    <Panel title={props.title} framed actions={props.actions}>
      {pipe(
        props.onSearchQueryChange,
        option.fold(constNull, () => (
          <Input
            type="text"
            name="search"
            label={inputLabel}
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
        ))
      )}
      {props.children}
      {pipe(
        props.query,
        query.fold(
          () => <LoadingBlock size="large" />,
          error => <Body color="danger">{error}</Body>,
          connection => (
            <>
              <List
                heading={option.none}
                items={getConnectionNodes(connection).map(props.renderListItem)}
                emptyListMessage={props.emptyListMessage}
              />
              {pipe(
                connection.pageInfo.hasNextPage,
                boolean.fold(constNull, () =>
                  pipe(
                    props.onLoadMore,
                    option.fold(constNull, onLoadMore => (
                      <Buttons>
                        <Button
                          type="button"
                          label={a18n`Load more`}
                          action={onLoadMore}
                          icon={option.some(refresh)}
                        />
                      </Buttons>
                    ))
                  )
                )
              )}
            </>
          )
        )
      )}
    </Panel>
  )
}
