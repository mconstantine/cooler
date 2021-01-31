import { FC } from 'react'
import './Heading.scss'
import * as t from 'io-ts'
import { Color, LocalizedString } from '../../globalDomain'
import { constNull, pipe } from 'fp-ts/function'
import { composeClassName } from '../../misc/composeClassName'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import { IO } from 'fp-ts/IO'
import { option } from 'fp-ts'
import { Button } from '../Button/Button/Button'
import { LoadingButton } from '../Button/LoadingButton/LoadingButton'

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
  action: IO<void>
  color?: Color
}

interface AsyncAction {
  type: 'async'
  label: LocalizedString
  action: TaskEither<LocalizedString, unknown>
  icon: string
  color?: Color
}

export type HeadingAction = SyncAction | AsyncAction

function foldHeadingAction<T>(
  whenSync: (action: SyncAction) => T,
  whenAsync: (action: AsyncAction) => T
): (action: HeadingAction) => T {
  return action => {
    switch (action.type) {
      case 'sync':
        return whenSync(action)
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
  action: Option<HeadingAction>
}

export const Heading: FC<Props> = props => {
  const color = props.color || 'default'

  const action = pipe(
    props.action,
    option.fold(
      constNull,
      foldHeadingAction(
        action => (
          <Button
            type="button"
            label={action.label}
            icon={action.icon}
            color={action.color}
            action={action.action}
          />
        ),
        action => (
          <LoadingButton
            type="button"
            label={action.label}
            icon={action.icon}
            color={action.color}
            action={action.action}
          />
        )
      )
    )
  )

  return pipe(
    props.size,
    foldHeadingSize(
      () => (
        <h1
          className={composeClassName('Heading', color, props.className || '')}
        >
          <span>{props.children}</span>
          {action}
        </h1>
      ),
      () => (
        <h2
          className={composeClassName('Heading', color, props.className || '')}
        >
          <span>{props.children}</span>
          {action}
        </h2>
      ),
      () => (
        <h3
          className={composeClassName('Heading', color, props.className || '')}
        >
          <span>{props.children}</span>
          {action}
        </h3>
      ),
      () => (
        <h4
          className={composeClassName('Heading', color, props.className || '')}
        >
          <span>{props.children}</span>
          {action}
        </h4>
      ),
      () => (
        <h5
          className={composeClassName('Heading', color, props.className || '')}
        >
          <span>{props.children}</span>
          {action}
        </h5>
      ),
      () => (
        <h6
          className={composeClassName('Heading', color, props.className || '')}
        >
          <span>{props.children}</span>
          {action}
        </h6>
      )
    )
  )
}
