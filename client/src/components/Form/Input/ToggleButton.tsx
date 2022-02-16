import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Color, LocalizedString } from '../../../globalDomain'
import {
  Button,
  ButtonProps,
  foldButtonProps
} from '../../Button/Button/Button'
import { FieldProps } from '../useForm'

type Props = Omit<ButtonProps, keyof FieldProps<boolean> | 'label' | 'action'> &
  FieldProps<boolean> &
  (
    | {
        type: 'button'
        label: LocalizedString
        flat?: boolean
      }
    | {
        type: 'iconButton'
      }
  )

export function ToggleButton(props: Props) {
  const { value, onChange, error, warning, ...buttonProps } = props

  const action = () => onChange(!value)
  const color: Color = pipe(
    error,
    option.fold(
      () =>
        pipe(
          warning,
          option.fold(
            () => props.color || 'default',
            () => 'warning'
          )
        ),
      () => 'danger'
    )
  )

  return pipe(
    { ...buttonProps, action, color } as ButtonProps,
    foldButtonProps(
      props => <Button {...props} active={value} />,
      props => <Button {...props} active={value} />
    )
  )
}
