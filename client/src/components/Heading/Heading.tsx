import './Heading.scss'
import * as t from 'io-ts'
import { Color, LocalizedString } from '../../globalDomain'
import { constFalse, constNull, constTrue, pipe } from 'fp-ts/function'
import { composeClassName } from '../../misc/composeClassName'
import { Option } from 'fp-ts/Option'
import { nonEmptyArray, option } from 'fp-ts'
import { Button } from '../Button/Button/Button'
import { LoadingButton } from '../Button/LoadingButton/LoadingButton'
import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { Buttons } from '../Button/Buttons/Buttons'
import { Reader } from 'fp-ts/Reader'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'

export const HeadingSize = t.keyof({
  40: true,
  36: true,
  32: true,
  27: true,
  24: true,
  21: true
})
export type HeadingSize = t.TypeOf<typeof HeadingSize>

function foldHeadingSize<T>(
  when40: () => T,
  when36: () => T,
  when32: () => T,
  when27: () => T,
  when24: () => T,
  when21: () => T
): (size: HeadingSize) => T {
  return size => {
    switch (size) {
      case 40:
        return when40()
      case 36:
        return when36()
      case 32:
        return when32()
      case 27:
        return when27()
      case 24:
        return when24()
      case 21:
        return when21()
    }
  }
}

interface SyncAction {
  type: 'sync'
  label: LocalizedString
  icon: Option<string>
  action: Reader<boolean, unknown>
  color?: Color
}

interface IconAction {
  type: 'icon'
  icon: string
  action: Reader<boolean, unknown>
  color?: Color
}

interface AsyncAction {
  type: 'async'
  label: Option<LocalizedString>
  action: ReaderTaskEither<boolean, LocalizedString, unknown>
  icon: string
  color?: Color
}

export type HeadingAction = SyncAction | IconAction | AsyncAction

export function foldHeadingAction<T>(
  whenSync: (action: SyncAction) => T,
  whenIcon: (action: IconAction) => T,
  whenAsync: (action: AsyncAction) => T
): (action: HeadingAction) => T {
  return action => {
    switch (action.type) {
      case 'sync':
        return whenSync(action)
      case 'icon':
        return whenIcon(action)
      case 'async':
        return whenAsync(action)
    }
  }
}

interface Props {
  size: HeadingSize
  color?: Color
  className?: string
  children: LocalizedString
  actions: Option<NonEmptyArray<HeadingAction>>
}

export function Heading(props: Props) {
  const color = props.color || 'default'

  const isActionFlat = pipe(
    props.size,
    foldHeadingSize(
      constFalse,
      constFalse,
      constFalse,
      constTrue,
      constTrue,
      constTrue
    )
  )

  const actions = pipe(
    props.actions,
    option.fold(constNull, actions => (
      <Buttons>
        {pipe(
          actions,
          nonEmptyArray.mapWithIndex((index, action) =>
            pipe(
              action,
              foldHeadingAction(
                action => (
                  <Button
                    key={index}
                    type="button"
                    label={action.label}
                    icon={action.icon}
                    color={action.color}
                    action={action.action}
                    flat={isActionFlat}
                  />
                ),
                action => (
                  <Button
                    key={index}
                    type="iconButton"
                    icon={action.icon}
                    color={action.color}
                    action={action.action}
                  />
                ),
                action => (
                  <LoadingButton
                    key={index}
                    type="loadingButton"
                    label={action.label}
                    icon={action.icon}
                    color={action.color}
                    action={action.action}
                    flat={isActionFlat}
                  />
                )
              )
            )
          )
        )}
      </Buttons>
    ))
  )

  return (
    <div
      className={composeClassName(
        'Heading',
        color,
        `s${props.size}`,
        props.className || ''
      )}
    >
      {pipe(
        props.size,
        foldHeadingSize(
          () => <h1>{props.children}</h1>,
          () => <h2>{props.children}</h2>,
          () => <h3>{props.children}</h3>,
          () => <h4>{props.children}</h4>,
          () => <h5>{props.children}</h5>,
          () => <h6>{props.children}</h6>
        )
      )}
      {actions}
    </div>
  )
}
