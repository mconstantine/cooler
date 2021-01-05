import { either, option } from 'fp-ts'
import { constFalse, constNull, pipe } from 'fp-ts/function'
import { alert, warning as warningIcon } from 'ionicons/icons'
import { FC } from 'react'
import { BooleanFromString, LocalizedString } from '../../../../globalDomain'
import { composeClassName } from '../../../../misc/composeClassName'
import { Label } from '../../../Label/Label'
import { FieldProps } from '../../useForm'
import './Toggle.scss'

interface Props extends FieldProps {
  label: LocalizedString
  disabled?: boolean
}

export const Toggle: FC<Props> = props => {
  const checked = pipe(
    BooleanFromString.decode(props.value),
    either.getOrElse(constFalse)
  )

  const checkedClassName = checked ? 'checked' : ''
  const disabledClassName = props.disabled ? 'disabled' : ''

  const colorClassName = pipe(
    props.error,
    option.fold(
      () =>
        pipe(
          props.warning,
          option.fold(
            () => '',
            () => 'warning'
          )
        ),
      () => 'error'
    )
  )

  return (
    <div
      className={composeClassName(
        'Toggle',
        checkedClassName,
        colorClassName,
        disabledClassName
      )}
    >
      <label htmlFor={props.name}>
        <input
          id={props.name}
          name={props.name}
          type="checkbox"
          checked={checked}
          onChange={e =>
            props.onChange(
              pipe(e.currentTarget.checked, BooleanFromString.encode)
            )
          }
          disabled={props.disabled}
        />
        <span className="label">{props.label}</span>
        <span className="switch" />
      </label>
      {pipe(
        props.error,
        option.fold(
          () =>
            pipe(
              props.warning,
              option.fold(constNull, warning => (
                <div className="warning">
                  <Label content={warning} icon={warningIcon} color="warning" />
                </div>
              ))
            ),
          error => (
            <div className="error">
              <Label content={error} icon={alert} color="danger" />
            </div>
          )
        )
      )}
    </div>
  )
}
