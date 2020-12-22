import { option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import { alert, send } from 'ionicons/icons'
import { ComponentProps, FC, FormEvent, useEffect, useState } from 'react'
import { a18n } from '../../a18n'
import { LocalizedString } from '../../globalDomain'
import { Button } from '../Button/Button/Button'
import { Buttons } from '../Button/Buttons/Buttons'
import {
  ControlledLoadingButton,
  LoadingState
} from '../Button/LoadingButton/ControlledLoadingButton'
import { Label } from '../Label/Label'
import { Panel } from '../Panel/Panel'
import './Form.scss'

interface Props {
  title: LocalizedString
  submit: TaskEither<unknown, unknown>
  submitLabel?: LocalizedString
  submitIcon?: string
  formError: Option<LocalizedString>
  additionalButtons?: Array<ComponentProps<typeof Button>>
}

export const Form: FC<Props> = ({
  submitLabel = a18n`Submit`,
  submitIcon = send,
  additionalButtons = [],
  ...props
}) => {
  const [loadingState, setLoadingState] = useState<LoadingState>('default')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setLoadingState('loading')

    pipe(
      props.submit,
      taskEither.bimap(
        () => setLoadingState('error'),
        () => setLoadingState(() => 'success')
      )
    )()
  }

  useEffect(() => {
    const timeout =
      loadingState === 'success' || loadingState === 'error'
        ? window.setTimeout(() => setLoadingState('default'), 2500)
        : undefined

    return () => {
      window.clearTimeout(timeout)
    }
  }, [loadingState])

  return (
    <Panel title={props.title} framed>
      <form className="Form" onSubmit={onSubmit}>
        {props.children}

        {pipe(
          props.formError,
          option.fold(
            () => null,
            error => <Label icon={alert} color="danger" content={error} />
          )
        )}

        <Buttons spacing="spread">
          {[
            <ControlledLoadingButton
              key={0}
              type="input"
              color="primary"
              label={submitLabel}
              icon={submitIcon}
              loadingState={loadingState}
            />,
            ...additionalButtons.map((props, index) => (
              <Button key={index + 1} {...props} />
            ))
          ]}
        </Buttons>
      </form>
    </Panel>
  )
}
