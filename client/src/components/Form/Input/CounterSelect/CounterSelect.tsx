import { option } from 'fp-ts'
import { chevronBack, chevronForward } from 'ionicons/icons'
import { LocalizedString } from '../../../../globalDomain'
import { Button } from '../../../Button/Button/Button'
import {
  Select,
  SelectState,
  getOptionValue,
  UnsearchableSelectProps
} from '../Select/Select'
import './CounterSelect.scss'
import { constVoid, flow, pipe } from 'fp-ts/function'
import { composeClassName } from '../../../../misc/composeClassName'

interface Props<T extends string | number | symbol>
  extends Omit<UnsearchableSelectProps<T>, 'type'> {
  onBack: (currentOption: T) => T
  onForward: (currentValue: T) => T
}

export function CounterSelect<T extends number>({
  className = '',
  ...props
}: Props<T>) {
  const disabled =
    option.isNone(getOptionValue(props.value)) ||
    option.isSome(props.error) ||
    props.disabled

  const onBack = () => {
    const keys = Object.keys(props.options)

    pipe(
      getOptionValue(props.value),
      option.map(flow(props.onBack, props.codec.encode)),
      option.map(
        flow(
          option.fromPredicate(nextKey => keys.includes(nextKey)),
          option.getOrElse(() => keys[keys.length - 1])
        )
      ),
      option.chain(flow(props.codec.decode, option.fromEither)),
      option.map(
        value => [option.some(value), props.options[value]] as SelectState<T>
      ),
      option.fold(constVoid, props.onChange)
    )
  }

  const onForward = () => {
    const keys = Object.keys(props.options)

    pipe(
      getOptionValue(props.value),
      option.map(flow(props.onForward, props.codec.encode)),
      option.map(
        flow(
          option.fromPredicate(nextKey => keys.includes(nextKey)),
          option.getOrElse(() => keys[0])
        )
      ),
      option.chain(flow(props.codec.decode, option.fromEither)),
      option.map(
        value => [option.some(value), props.options[value]] as SelectState<T>
      ),
      option.fold(constVoid, props.onChange)
    )
  }

  return (
    <Select
      type="async"
      {...props}
      className={composeClassName('CounterSelect', className)}
      onQueryChange={constVoid}
      emptyPlaceholder={'' as LocalizedString}
      isLoading={false}
    >
      <Button
        className="back"
        type="iconButton"
        icon={chevronBack}
        action={onBack}
        disabled={disabled}
      />
      <Button
        className="forward"
        type="iconButton"
        icon={chevronForward}
        action={onForward}
        disabled={disabled}
      />
    </Select>
  )
}
