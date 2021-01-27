import { boolean, option } from 'fp-ts'
import { chevronBack, chevronForward } from 'ionicons/icons'
import { Color, LocalizedString } from '../../../../globalDomain'
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
import {
  forwardRef,
  PropsWithoutRef,
  Ref,
  RefAttributes,
  useState
} from 'react'

interface Props<T extends string | number | symbol>
  extends Omit<UnsearchableSelectProps<T>, 'type'> {
  onBack: (currentOption: T) => T
  onForward: (currentValue: T) => T
}

type CounterSelect = <T extends number>(
  props: PropsWithoutRef<Props<T>> & RefAttributes<HTMLInputElement>
) => JSX.Element

// @ts-ignore
export const CounterSelect: CounterSelect = forwardRef(
  <T extends number>(
    { className = '', ...props }: Props<T>,
    ref: Ref<HTMLInputElement>
  ) => {
    const [isFocus, setIsFocus] = useState(false)

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

    const color: Color = pipe(
      props.error,
      option.fold(
        () =>
          pipe(
            props.warning,
            option.fold(
              () =>
                pipe(
                  isFocus,
                  boolean.fold(
                    () => 'default',
                    () => 'primary'
                  )
                ),
              () => 'warning'
            )
          ),
        () => 'danger'
      )
    )

    return (
      <Select
        type="async"
        {...props}
        className={composeClassName('CounterSelect', className)}
        onQueryChange={constVoid}
        emptyPlaceholder={'' as LocalizedString}
        isLoading={false}
        onFocus={() => setIsFocus(true)}
        onBlur={() => setIsFocus(false)}
        ref={ref}
      >
        <Button
          className="back"
          type="iconButton"
          icon={chevronBack}
          action={onBack}
          disabled={disabled}
          color={color}
        />
        <Button
          className="forward"
          type="iconButton"
          icon={chevronForward}
          action={onForward}
          disabled={disabled}
          color={color}
        />
      </Select>
    )
  }
)
