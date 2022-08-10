import { taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { useEffect, useState } from 'react'
import { LocalizedString } from '../../../globalDomain'

import {
  ControlledLoadingButton,
  LoadingState,
  CommonProps,
  ButtonProps,
  InputProps
} from './ControlledLoadingButton'

type Props = Omit<CommonProps, 'loadingState' | 'label'> &
  (
    | Omit<ButtonProps, 'loadingState' | 'label'>
    | Omit<InputProps, 'loadingState'>
  ) & {
    label: Option<LocalizedString>
  }

export function LoadingButton(props: Props) {
  const [loadingState, setLoadingState] = useState<LoadingState>('default')

  useEffect(() => {
    const timeout =
      loadingState === 'success' || loadingState === 'error'
        ? window.setTimeout(() => {
            setLoadingState('default')
          }, 2500)
        : undefined

    return () => window.clearTimeout(timeout)
  }, [loadingState])

  if (props.type === 'loadingButton') {
    const action = pipe(
      taskEither.fromIO(() => setLoadingState('loading')),
      taskEither.chain(() => props.action),
      taskEither.bimap(
        () => setLoadingState('error'),
        () => setLoadingState('success')
      )
    )

    return (
      <ControlledLoadingButton
        {...props}
        loadingState={loadingState}
        action={action}
      />
    )
  } else {
    return <ControlledLoadingButton {...props} loadingState={loadingState} />
  }
}
