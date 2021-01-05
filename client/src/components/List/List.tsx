import { boolean, option } from 'fp-ts'
import { constNull, constUndefined, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { FC, MouseEvent } from 'react'
import { Color, LocalizedString } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import { Icon } from '../Icon/Icon'
import { Label } from '../Label/Label'
import './List.scss'
import * as t from 'io-ts'
import { chevronForwardOutline } from 'ionicons/icons'

const ListType = t.keyof(
  {
    readonly: true,
    readonlyWithIcon: true,
    routed: true,
    routedWithIcon: true
  },
  'ListType'
)
type ListType = t.TypeOf<typeof ListType>

export interface ReadonlyItem {
  key: string | number
  label: Option<LocalizedString>
  content: LocalizedString
  description: Option<LocalizedString>
  disabled?: boolean
  className?: string
}

export interface ReadonlyItemWithIcon {
  icon: string
  iconColor?: Color
}

export interface RoutedItem {
  action: () => unknown
}

export interface RoutedItemWithIcon {
  icon: string
  iconColor: Color
  action: () => unknown
}

export type Item = ReadonlyItem &
  (ReadonlyItemWithIcon | RoutedItem | RoutedItemWithIcon)

function foldItem<T>(
  listType: ListType,
  whenReadonly: (item: ReadonlyItem) => T,
  whenWithIcon: (item: ReadonlyItemWithIcon) => T,
  whenRouted: (item: RoutedItem) => T,
  whenRoutedWithIcon: (item: RoutedItemWithIcon) => T
): (item: Item) => T {
  return item => {
    switch (listType) {
      case 'readonly':
        return whenReadonly(item as ReadonlyItem)
      case 'readonlyWithIcon':
        return whenWithIcon(item as ReadonlyItemWithIcon)
      case 'routed':
        return whenRouted(item as RoutedItem)
      case 'routedWithIcon':
        return whenRoutedWithIcon(item as RoutedItemWithIcon)
    }
  }
}

function foldItemIcon<T>(
  listType: ListType,
  whenNotWithIcon: (item: ReadonlyItem | RoutedItem) => T,
  whenWithIcon: (item: ReadonlyItemWithIcon | RoutedItemWithIcon) => T
): (item: Item) => T {
  return foldItem(
    listType,
    whenNotWithIcon,
    whenWithIcon,
    whenNotWithIcon,
    whenWithIcon
  )
}

function foldItemRouted<T>(
  listType: ListType,
  whenReadonly: (item: ReadonlyItem | ReadonlyItemWithIcon) => T,
  whenRouted: (item: RoutedItem | RoutedItemWithIcon) => T
): (item: Item) => T {
  return foldItem(listType, whenReadonly, whenReadonly, whenRouted, whenRouted)
}

type Props = {
  heading: Option<LocalizedString>
  unwrapDescriptions?: boolean
} & (
  | {
      type: 'readonly'
      items: ReadonlyItem[]
    }
  | {
      type: 'readonlyWithIcon'
      iconsPosition: 'start' | 'end'
      items: ReadonlyItemWithIcon[]
    }
  | {
      type: 'routed'
      items: RoutedItem[]
      details?: boolean
    }
  | {
      type: 'routedWithIcon'
      items: RoutedItemWithIcon[]
      details?: boolean
    }
)

export const List: FC<Props> = ({
  heading,
  unwrapDescriptions = false,
  items,
  ...props
}) => {
  const unwrap = pipe(
    unwrapDescriptions,
    boolean.fold(
      () => '',
      () => 'unwrap'
    )
  )

  const iconsAtTheEndClassName =
    props.type === 'readonlyWithIcon' && props.iconsPosition === 'end'
      ? 'iconsAtTheEnd'
      : ''

  const routedClassName =
    props.type === 'routed' || props.type === 'routedWithIcon' ? 'routed' : ''

  const hasDetails =
    (props.type === 'routed' || props.type === 'routedWithIcon') &&
    props.details

  const detailsClassName = hasDetails ? 'details' : ''

  return (
    <div
      className={composeClassName(
        'List',
        routedClassName,
        unwrap,
        iconsAtTheEndClassName,
        detailsClassName
      )}
    >
      {pipe(
        heading,
        option.map(heading => <h5 className="heading">{heading}</h5>),
        option.toNullable
      )}
      <ul>
        {(items as Item[]).map(item => {
          const disabledClassName = item.disabled ? 'disabled' : ''

          return (
            <li
              key={item.key}
              onClick={pipe(
                item,
                foldItemRouted(
                  props.type,
                  constUndefined,
                  ({ action }) => (e: MouseEvent) => {
                    e.preventDefault()

                    if (item.disabled) {
                      return
                    }

                    return action()
                  }
                )
              )}
              className={composeClassName(
                item.className || '',
                disabledClassName
              )}
            >
              <div className="itemContentOuterWrapper">
                <div className="itemContentWrapper">
                  {pipe(
                    item,
                    foldItemIcon(
                      props.type,
                      constNull,
                      ({ icon, iconColor = 'default' }) => (
                        <Icon color={iconColor} src={icon} />
                      )
                    )
                  )}
                  <div className="itemContent">
                    {pipe(
                      item.label,
                      option.map(label => <Label content={label} />),
                      option.toNullable
                    )}
                    <h6 className="content">{item.content}</h6>
                    {pipe(
                      item.description,
                      option.map(description => (
                        <p className="description">{description}</p>
                      )),
                      option.toNullable
                    )}
                  </div>
                </div>

                {hasDetails ? (
                  <div className="routeArrow">
                    <Icon src={chevronForwardOutline} size="medium" />
                  </div>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
