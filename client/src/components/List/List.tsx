import { boolean, option } from 'fp-ts'
import {
  constFalse,
  constNull,
  constTrue,
  constUndefined,
  pipe
} from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { FC, MouseEvent } from 'react'
import { Color, LocalizedString } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import { Icon } from '../Icon/Icon'
import { Label } from '../Label/Label'
import './List.scss'
import { chevronForwardOutline } from 'ionicons/icons'

interface CommonItemProps {
  key: string | number
  label: Option<LocalizedString>
  content: LocalizedString
  description: Option<LocalizedString>
  disabled?: boolean
  className?: string
}

export interface ReadonlyItem extends CommonItemProps {
  type: 'readonly'
}

export interface ReadonlyItemWithIcon extends CommonItemProps {
  type: 'readonlyWithIcon'
  icon: string
  iconPosition: 'start' | 'end'
  iconColor?: Color
}

export interface RoutedItem extends CommonItemProps {
  type: 'routed'
  details?: boolean
  action: () => unknown
}

export interface RoutedItemWithIcon extends CommonItemProps {
  type: 'routedWithIcon'
  icon: string
  iconPosition: 'start' | 'end'
  iconColor: Color
  details?: boolean
  action: () => unknown
}

export type Item =
  | ReadonlyItem
  | ReadonlyItemWithIcon
  | RoutedItem
  | RoutedItemWithIcon

function foldItem<T>(
  whenReadonly: (item: ReadonlyItem) => T,
  whenWithIcon: (item: ReadonlyItemWithIcon) => T,
  whenRouted: (item: RoutedItem) => T,
  whenRoutedWithIcon: (item: RoutedItemWithIcon) => T
): (item: Item) => T {
  return item => {
    switch (item.type) {
      case 'readonly':
        return whenReadonly(item)
      case 'readonlyWithIcon':
        return whenWithIcon(item)
      case 'routed':
        return whenRouted(item)
      case 'routedWithIcon':
        return whenRoutedWithIcon(item)
    }
  }
}

type Props = {
  heading: Option<LocalizedString>
  unwrapDescriptions?: boolean
  items: Item[]
}

export const List: FC<Props> = props => {
  const unwrap = pipe(
    !!props.unwrapDescriptions,
    boolean.fold(
      () => '',
      () => 'unwrap'
    )
  )

  return (
    <div className={composeClassName('List', unwrap)}>
      {pipe(
        props.heading,
        option.map(heading => <h5 className="heading">{heading}</h5>),
        option.toNullable
      )}
      <ul>
        {props.items.map(item => {
          const disabledClassName = item.disabled ? 'disabled' : ''

          const iconsAtTheEndClassName = pipe(
            item,
            foldItem(
              constFalse,
              ({ iconPosition }) => iconPosition === 'end',
              constFalse,
              ({ iconPosition }) => iconPosition === 'end'
            ),
            boolean.fold(
              () => '',
              () => 'iconsAtTheEnd'
            )
          )

          const routedClassName = pipe(
            item,
            foldItem(constFalse, constFalse, constTrue, constTrue),
            boolean.fold(
              () => '',
              () => 'routed'
            )
          )

          const hasDetails = pipe(
            item,
            foldItem(
              constFalse,
              constFalse,
              ({ details }) => !!details,
              ({ details }) => !!details
            )
          )

          const detailsClassName = pipe(
            hasDetails,
            boolean.fold(
              () => '',
              () => 'details'
            )
          )

          const getAction = (item: RoutedItem | RoutedItemWithIcon) => {
            return (e: MouseEvent) => {
              e.preventDefault()

              if (item.disabled) {
                return
              }

              return item.action()
            }
          }

          const getIcon = (item: ReadonlyItemWithIcon | RoutedItemWithIcon) => (
            <Icon color={item.iconColor} src={item.icon} />
          )

          return (
            <li
              key={item.key}
              onClick={pipe(
                item,
                foldItem(constUndefined, constUndefined, getAction, getAction)
              )}
              className={composeClassName(
                item.className || '',
                disabledClassName,
                iconsAtTheEndClassName,
                routedClassName,
                detailsClassName
              )}
            >
              <div className="itemContentOuterWrapper">
                <div className="itemContentWrapper">
                  {pipe(item, foldItem(constNull, getIcon, constNull, getIcon))}
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
