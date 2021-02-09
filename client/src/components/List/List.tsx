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
import {
  Color,
  LocalizedString,
  Percentage,
  PercentageFromString
} from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import { Icon } from '../Icon/Icon'
import { Label } from '../Label/Label'
import './List.scss'
import { chevronForwardOutline } from 'ionicons/icons'
import { Heading } from '../Heading/Heading'
import { Body } from '../Body/Body'
import { IO } from 'fp-ts/IO'

type Position = 'start' | 'end'
type Size = 'default' | 'small'

function foldSize<T>(
  whenDefault: () => T,
  whenSmall: () => T
): (size: Size) => T {
  return size => {
    switch (size) {
      case 'default':
        return whenDefault()
      case 'small':
        return whenSmall()
    }
  }
}

interface CommonItemProps {
  key: string | number
  label: Option<LocalizedString>
  content: LocalizedString
  description: Option<LocalizedString>
  disabled?: boolean
  className?: string
  size?: Size
}

export interface ReadonlyItem extends CommonItemProps {
  type: 'readonly'
}

export interface ReadonlyItemWithIcon extends CommonItemProps {
  type: 'readonlyWithIcon'
  icon: string
  iconPosition: Position
  iconColor?: Color
}

export interface RoutedItem extends CommonItemProps {
  type: 'routed'
  details?: boolean
  action: IO<unknown>
}

export interface RoutedItemWithIcon extends CommonItemProps {
  type: 'routedWithIcon'
  icon: string
  iconColor: Color
  details?: boolean
  action: IO<unknown>
}

export interface ValuedItem extends CommonItemProps {
  type: 'valued'
  value: LocalizedString
  valueColor?: Color
  progress: Option<Percentage>
}

export type Item =
  | ReadonlyItem
  | ReadonlyItemWithIcon
  | RoutedItem
  | RoutedItemWithIcon
  | ValuedItem

function foldItem<T>(
  whenReadonly: (item: ReadonlyItem) => T,
  whenWithIcon: (item: ReadonlyItemWithIcon) => T,
  whenRouted: (item: RoutedItem) => T,
  whenRoutedWithIcon: (item: RoutedItemWithIcon) => T,
  whenValued: (item: ValuedItem) => T
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
      case 'valued':
        return whenValued(item)
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
        option.map(heading => (
          <Heading size={24} className="heading" action={option.none}>
            {heading}
          </Heading>
        )),
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
              constFalse,
              constTrue
            ),
            boolean.fold(
              () => '',
              () => 'sideContentAtTheEnd'
            )
          )

          const routedClassName = pipe(
            item,
            foldItem(constFalse, constFalse, constTrue, constTrue, constFalse),
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
              ({ details }) => !!details,
              constFalse
            )
          )

          const detailsClassName = pipe(
            hasDetails,
            boolean.fold(
              () => '',
              () => 'details'
            )
          )

          const progressClassName = pipe(
            item,
            foldItem(
              () => '',
              () => '',
              () => '',
              () => '',
              item =>
                pipe(
                  item.progress,
                  option.fold(
                    () => '',
                    () => `withProgress ${item.valueColor}`
                  )
                )
            )
          )

          const sizeClassName = item.size || 'default'

          const getAction = (item: RoutedItem | RoutedItemWithIcon) => {
            return (e: MouseEvent) => {
              e.preventDefault()

              if (item.disabled) {
                return
              }

              return item.action()
            }
          }

          const renderIcon = (
            item: ReadonlyItemWithIcon | RoutedItemWithIcon
          ) => (
            <div className="itemSideContent">
              <Icon
                color={item.iconColor}
                src={item.icon}
                size={pipe(
                  item.size,
                  option.fromNullable,
                  option.fold(
                    () => 'large',
                    foldSize(
                      () => 'large',
                      () => 'small'
                    )
                  )
                )}
              />
            </div>
          )

          const renderValue = (item: ValuedItem) => (
            <div className="itemSideContent">
              <Label
                content={item.value}
                color={pipe(
                  item.progress,
                  option.fold(
                    () => item.valueColor,
                    () => 'default'
                  )
                )}
              />
            </div>
          )

          return (
            <li
              key={item.key}
              onClick={pipe(
                item,
                foldItem(
                  constUndefined,
                  constUndefined,
                  getAction,
                  getAction,
                  constUndefined
                )
              )}
              className={composeClassName(
                item.className || '',
                disabledClassName,
                iconsAtTheEndClassName,
                routedClassName,
                detailsClassName,
                sizeClassName,
                progressClassName
              )}
            >
              {pipe(
                item,
                foldItem(constNull, constNull, constNull, constNull, item =>
                  pipe(
                    item.progress,
                    option.fold(constNull, progress => (
                      <div
                        className={composeClassName(
                          'itemProgressBar',
                          item.valueColor || ''
                        )}
                        style={{
                          width: `${PercentageFromString.encode(progress)}%`
                        }}
                      />
                    ))
                  )
                )
              )}
              <div className="itemContentOuterWrapper">
                <div className="itemContentWrapper">
                  {pipe(
                    item,
                    foldItem(
                      constNull,
                      renderIcon,
                      constNull,
                      renderIcon,
                      renderValue
                    )
                  )}
                  <div className="itemContent">
                    {pipe(
                      item.label,
                      option.map(label => <Label content={label} />),
                      option.toNullable
                    )}
                    {pipe(
                      item.size || 'default',
                      foldSize(
                        () => <Body>{item.content}</Body>,
                        () => <Label content={item.content} />
                      )
                    )}
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
