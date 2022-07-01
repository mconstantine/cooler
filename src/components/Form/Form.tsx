import { option, taskEither } from 'fp-ts'
import { constNull, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import { alert, send } from 'ionicons/icons'
import {
  ComponentProps,
  FormEvent,
  PropsWithChildren,
  useEffect,
  useState
} from 'react'
import { a18n } from '../../a18n'
import { LocalizedString } from '../../globalDomain'
import { Button } from '../Button/Button/Button'
import { Buttons } from '../Button/Buttons/Buttons'
import {
  ControlledLoadingButton,
  LoadingState
} from '../Button/LoadingButton/ControlledLoadingButton'
import { Banner } from '../Banner/Banner'
import { Panel } from '../Panel/Panel'
import './Form.scss'
import { HeadingAction } from '../Heading/Heading'

interface Props extends PropsWithChildren {
  title: LocalizedString
  headingAction: Option<HeadingAction>
  submit: TaskEither<LocalizedString, unknown>
  submitLabel?: LocalizedString
  submitIcon?: string
  formError: Option<LocalizedString>
  additionalButtons?: Array<ComponentProps<typeof Button>>
}

export function Form(props: Props) {
  const submitLabel = props.submitLabel || a18n`Submit`
  const submitIcon = props.submitIcon || send
  const additionalButtons = props.additionalButtons || []

  const [loadingState, setLoadingState] = useState<LoadingState>('default')
  const [submitError, setSubmitError] = useState<Option<LocalizedString>>(
    option.none
  )

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()

    setLoadingState('loading')
    setSubmitError(option.none)

    pipe(
      props.submit,
      taskEither.bimap(
        error => {
          setSubmitError(option.some(error))
          setLoadingState('error')
        },
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
    <Panel title={props.title} framed action={props.headingAction}>
      <form className="Form" onSubmit={onSubmit}>
        {props.children}

        <div className="actions">
          {pipe(
            props.formError,
            option.fold(
              () =>
                pipe(
                  submitError,
                  option.fold(constNull, error => (
                    <Banner icon={alert} color="danger" content={error} />
                  ))
                ),
              error => <Banner icon={alert} color="danger" content={error} />
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
        </div>
      </form>
    </Panel>
  )
}
