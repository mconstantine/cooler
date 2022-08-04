import { option } from 'fp-ts'
import { constNull, constVoid, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { LocalizedString } from '../../../../globalDomain'
import { Button } from '../../../Button/Button/Button'
import { LoadingButton } from '../../../Button/LoadingButton/LoadingButton'
import { foldHeadingAction, HeadingAction } from '../../../Heading/Heading'
import { Input } from '../Input/Input'
import './ReadOnlyInput.scss'

interface Props {
  name: string
  label: LocalizedString
  value: LocalizedString
  action: Option<HeadingAction>
}

export function ReadOnlyInput(props: Props) {
  return (
    <div className="ReadOnlyInput">
      <Input
        name={props.name}
        label={props.label}
        value={props.value}
        onChange={constVoid}
        error={option.none}
        warning={option.none}
        readOnly
      />
      {pipe(
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
                flat
              />
            ),
            action => (
              <Button
                type="iconButton"
                icon={action.icon}
                color={action.color}
                action={action.action}
              />
            ),
            action => (
              <LoadingButton
                type="loadingButton"
                label={action.label}
                icon={action.icon}
                color={action.color}
                action={action.action}
                flat
              />
            )
          )
        )
      )}
    </div>
  )
}
