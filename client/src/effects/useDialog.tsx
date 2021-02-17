import { either, option } from 'fp-ts'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { FC, Reducer, useReducer, useRef } from 'react'
import { a18n } from '../a18n'
import { Body } from '../components/Body/Body'
import { Button } from '../components/Button/Button/Button'
import { Buttons } from '../components/Button/Buttons/Buttons'
import { Heading } from '../components/Heading/Heading'
import { Modal } from '../components/Modal/Modal'
import { LocalizedString } from '../globalDomain'
import {
  constFalse,
  constNull,
  constTrue,
  constVoid,
  flow,
  pipe
} from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { Either } from 'fp-ts/Either'

interface IdleState<I> {
  type: 'idle'
  latestInput: Option<I>
}

interface ShowingDialogState<I> {
  type: 'showingDialog'
  input: I
}

type State<I> = IdleState<I> | ShowingDialogState<I>

function foldState<I, T>(
  whenIdle: (state: IdleState<I>) => T,
  whenShowingDialog: (state: ShowingDialogState<I>) => T
): (state: State<I>) => T {
  return state => {
    switch (state.type) {
      case 'idle':
        return whenIdle(state)
      case 'showingDialog':
        return whenShowingDialog(state)
    }
  }
}

type Action<I> =
  | {
      type: 'showDialog'
      input: I
    }
  | {
      type: 'confirm'
    }
  | {
      type: 'cancel'
    }

function reducer<I>(state: State<I>, action: Action<I>): State<I> {
  switch (state.type) {
    case 'idle':
      switch (action.type) {
        case 'showDialog':
          return {
            type: 'showingDialog',
            input: action.input
          }
        case 'confirm':
        case 'cancel':
          return state
      }
    case 'showingDialog':
      switch (action.type) {
        case 'showDialog':
          return state
        case 'confirm':
        case 'cancel':
          return {
            type: 'idle',
            latestInput: option.some(state.input)
          }
      }
  }
}

interface Props<I> {
  title: (input: I) => LocalizedString
  message: (input: I) => LocalizedString
  confirmLabel?: (input: I) => LocalizedString
  cancelLabel?: (input: I) => LocalizedString
}

export function useDialog<I, E, O>(
  callback: ReaderTaskEither<I, E, O>,
  props: Props<I>
): [FC<{}>, ReaderTaskEither<I, E, O>] {
  const [state, dispatch] = useReducer<Reducer<State<I>, Action<I>>>(reducer, {
    type: 'idle',
    latestInput: option.none
  })

  const resolution = useRef<Option<(result: 'confirm' | 'cancel') => void>>(
    option.none
  )

  const defaultConfirmLabel = a18n`Confirm`
  const defaultCancelLabel = a18n`Cancel`

  const askForConfirmation = (input: I) => () =>
    new Promise<Either<E, O>>(resolve => {
      dispatch({
        type: 'showDialog',
        input
      })

      // eslint-disable-next-line
      resolution.current = option.some(result => {
        resolution.current = option.none

        if (result === 'cancel') {
          return resolve(either.left(a18n`You cancelled the action`) as any)
        }

        callback(input)().then(resolve)
      })
    })

  const onCancel = () => {
    dispatch({
      type: 'cancel'
    })

    pipe(
      resolution.current,
      option.fold(constVoid, resolution => resolution('cancel'))
    )
  }

  const onConfirm = () => {
    dispatch({
      type: 'confirm'
    })

    pipe(
      resolution.current,
      option.fold(constVoid, resolution => resolution('confirm'))
    )
  }

  const getDialogContent = (input: I) => (
    <>
      <Heading size={27} action={option.none}>
        {props.title(input)}
      </Heading>
      <Body>{props.message(input)}</Body>
      <Buttons>
        <Button
          type="button"
          label={props.cancelLabel?.(input) ?? defaultCancelLabel}
          icon={option.none}
          action={onCancel}
        />
        <Button
          type="button"
          label={props.confirmLabel?.(input) ?? defaultConfirmLabel}
          icon={option.none}
          action={onConfirm}
        />
      </Buttons>
    </>
  )

  const Dialog = () => (
    <Modal
      isOpen={pipe(state, foldState(constFalse, constTrue))}
      onClose={onCancel}
      framed
    >
      {pipe(
        state,
        foldState(
          flow(
            ({ latestInput }) => latestInput,
            option.fold(constNull, getDialogContent)
          ),
          state => getDialogContent(state.input)
        )
      )}
    </Modal>
  )

  return [Dialog, askForConfirmation]
}
