import { taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { FC, useEffect, useState } from 'react'

import {
  ControlledLoadingButton,
  LoadingState,
  CommonProps,
  ButtonProps,
  InputProps
} from './ControlledLoadingButton'

type Props = Omit<CommonProps, 'loadingState'> &
  (Omit<ButtonProps, 'loadingState'> | Omit<InputProps, 'loadingState'>)

export const LoadingButton: FC<Props> = props => {
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

  if (props.type === 'button') {
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
