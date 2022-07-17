import { boolean, option } from 'fp-ts'
import {
  constFalse,
  constNull,
  constTrue,
  constUndefined,
  pipe
} from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { ComponentProps, MouseEvent } from 'react'
import {
  Color,
  LocalizedString,
  Percentage,
  PercentageFromString
} from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import { Icon } from '../Icon/Icon'
import './List.scss'
import { chevronForward } from 'ionicons/icons'
import { Heading } from '../Heading/Heading'
import { Body } from '../Body/Body'
import { IO } from 'fp-ts/IO'
import { Banner } from '../Banner/Banner'
import { Button } from '../Button/Button/Button'
import { Reader } from 'fp-ts/Reader'
import { LoadingButton } from '../Button/LoadingButton/LoadingButton'
import { Buttons } from '../Button/Buttons/Buttons'

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

type ButtonProps =
  | ComponentProps<typeof Button>
  | ComponentProps<typeof LoadingButton>

export interface ItemWithButtons extends CommonItemProps {
  type: 'withButtons'
  buttons: ButtonProps[]
}

export type Item =
  | ReadonlyItem
  | ReadonlyItemWithIcon
  | RoutedItem
  | RoutedItemWithIcon
  | ValuedItem
  | ItemWithButtons

function foldItem<T>(cases: {
  [k in Item['type']]: Reader<Extract<Item, { type: k }>, T>
}): Reader<Item, T> {
  return item => cases[item.type](item as any)
}

type Props = {
  heading: Option<LocalizedString>
  unwrapDescriptions?: boolean
  items: Item[]
}

export function List(props: Props) {
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
            foldItem({
              readonly: constFalse,
              readonlyWithIcon: ({ iconPosition }) => iconPosition === 'end',
              routed: constFalse,
              routedWithIcon: constFalse,
              valued: constTrue,
              withButtons: constFalse
            }),
            boolean.fold(
              () => '',
              () => 'sideContentAtTheEnd'
            )
          )

          const routedClassName = pipe(
            item,
            foldItem({
              readonly: constFalse,
              readonlyWithIcon: constFalse,
              routed: constTrue,
              routedWithIcon: constTrue,
              valued: constFalse,
              withButtons: constFalse
            }),
            boolean.fold(
              () => '',
              () => 'routed'
            )
          )

          const hasDetails = pipe(
            item,
            foldItem({
              readonly: constFalse,
              readonlyWithIcon: constFalse,
              routed: ({ details }) => !!details,
              routedWithIcon: ({ details }) => !!details,
              valued: constFalse,
              withButtons: constFalse
            })
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
            foldItem({
              readonly: () => '',
              readonlyWithIcon: () => '',
              routed: () => '',
              routedWithIcon: () => '',
              valued: item =>
                pipe(
                  item.progress,
                  option.fold(
                    () => '',
                    () => `withProgress ${item.valueColor}`
                  )
                ),
              withButtons: () => ''
            })
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
              <Banner
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
                foldItem({
                  readonly: constUndefined,
                  readonlyWithIcon: constUndefined,
                  routed: getAction,
                  routedWithIcon: getAction,
                  valued: constUndefined,
                  withButtons: constUndefined
                })
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
              aria-label={item.content}
            >
              {pipe(
                item,
                foldItem({
                  readonly: constNull,
                  readonlyWithIcon: constNull,
                  routed: constNull,
                  routedWithIcon: constNull,
                  valued: item =>
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
                    ),
                  withButtons: constNull
                })
              )}
              <div className="itemContentOuterWrapper">
                <div className="itemContentWrapper">
                  {pipe(
                    item,
                    foldItem({
                      readonly: constNull,
                      readonlyWithIcon: renderIcon,
                      routed: constNull,
                      routedWithIcon: renderIcon,
                      valued: renderValue,
                      withButtons: constNull
                    })
                  )}
                  <div className="itemContent">
                    {pipe(
                      item.label,
                      option.map(label => <Banner content={label} />),
                      option.toNullable
                    )}
                    {pipe(
                      item.size || 'default',
                      foldSize(
                        () => <Body>{item.content}</Body>,
                        () => <Banner content={item.content} />
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
                    <Icon src={chevronForward} size="medium" />
                  </div>
                ) : null}
              </div>
              {pipe(
                item,
                foldItem({
                  readonly: constNull,
                  readonlyWithIcon: constNull,
                  routed: constNull,
                  routedWithIcon: constNull,
                  valued: constNull,
                  withButtons: ({ buttons }) => (
                    <Buttons>
                      {buttons.map(props => {
                        switch (props.type) {
                          case 'button':
                          case 'iconButton':
                            return <Button {...props} />
                          case 'loadingButton':
                          case 'loadingInput':
                            return <LoadingButton {...props} />
                        }
                      })}
                    </Buttons>
                  )
                })
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
