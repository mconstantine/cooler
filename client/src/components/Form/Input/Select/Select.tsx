import { array, boolean, option, record } from 'fp-ts'
import { constUndefined, constVoid, flow, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { caretDownSharp } from 'ionicons/icons'
import {
  FocusEvent,
  forwardRef,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import { useCombinedRefs } from '../../../../effects/useCombinedRef'
import { Color, LocalizedString } from '../../../../globalDomain'
import { composeClassName } from '../../../../misc/composeClassName'
import { Icon } from '../../../Icon/Icon'
import { List } from '../../../List/List'
import { FieldProps } from '../../useForm'
import { Input } from '../Input/Input'
import './Select.scss'

export interface SelectProps extends FieldProps {
  className?: string
  label: LocalizedString
  options: Record<string, LocalizedString>
  onFocus?: (e: FocusEvent) => void
  onBlur?: (e: FocusEvent) => void
  unsearchable?: boolean
  disabled?: boolean
  children?: ReactNode
}

export const Select = forwardRef<HTMLInputElement, SelectProps>(
  (
    {
      unsearchable = false,
      options,
      onBlur: onBlurProp,
      className = '',
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [highlightedItem, setHighlightedItem] = useState<Option<string>>(
      option.none
    )

    const [label, setLabel] = useState(
      pipe(
        Object.entries(options).find(([key]) => key === props.value),
        option.fromNullable,
        option.map(([, value]) => value),
        option.getOrElse(() => '')
      )
    )

    const innerRef = useRef<HTMLInputElement>(null)
    const inputRef = useCombinedRefs(innerRef, ref)

    const regex = new RegExp(label, 'i')
    const filteredOptions: Record<string, LocalizedString> = pipe(
      unsearchable,
      boolean.fold(
        () =>
          pipe(
            options,
            record.filter(label => regex.test(label))
          ),
        () => options
      )
    )

    const notifyChange = useCallback(
      (label: string): void => {
        pipe(
          Object.entries(options).find(([, value]) => value === label),
          option.fromNullable,
          option.map(([key]) => key),
          option.fold(constVoid, props.onChange)
        )
      },
      [options, props.onChange]
    )

    const onFocus = (e?: FocusEvent) => {
      e && props.onFocus?.(e)
      inputRef.current?.select()
      setIsOpen(true)
    }

    const onBlur = useCallback(
      (e?: FocusEvent) => {
        setHighlightedItem(option.none)

        if (record.size(filteredOptions) === 1) {
          const label = Object.values(filteredOptions)[0]
          setLabel(label)
          notifyChange(label)
        }

        window.setTimeout(() => {
          e && onBlurProp?.(e)
          setIsOpen(false)
        }, 150)
      },
      [filteredOptions, notifyChange, onBlurProp]
    )

    const onInputChange = (input: string) => {
      setLabel(input)
      setIsOpen(true)
      setHighlightedItem(option.none)

      pipe(
        Object.entries(options).find(([, value]) => value === input),
        option.fromNullable,
        option.map(([key]) => key),
        option.getOrElse(() => ''),
        props.onChange
      )
    }

    const iconColor: Color = pipe(
      props.error,
      option.fold(
        () =>
          pipe(
            isOpen,
            boolean.fold(
              () => 'default',
              () => 'primary'
            )
          ),
        () => 'danger'
      )
    )

    const openClassName = isOpen ? 'open' : ''

    useEffect(() => {
      const inputElement = inputRef.current

      const onKeyUp = (e: KeyboardEvent) => {
        e.stopPropagation()

        if (e.code === 'Escape') {
          onBlur()
        } else if (e.code === 'ArrowDown') {
          const items = Object.keys(filteredOptions)

          setHighlightedItem(
            flow(
              option.fold(
                () => pipe(items[0], option.fromNullable),
                highlightedItem =>
                  pipe(
                    items,
                    array.findIndex(key => key === highlightedItem),
                    option.map(n => n + 1),
                    option.map(n => items[n]),
                    option.map(key => key || items[0])
                  )
              )
            )
          )
        } else if (e.code === 'ArrowUp') {
          const items = Object.keys(filteredOptions)

          setHighlightedItem(
            flow(
              option.fold(
                () => pipe(items[items.length - 1], option.fromNullable),
                highlightedItem =>
                  pipe(
                    items,
                    array.findIndex(key => key === highlightedItem),
                    option.map(n => n - 1),
                    option.map(n => items[n]),
                    option.map(key => key || items[items.length - 1])
                  )
              )
            )
          )
        }
      }

      if (isOpen) {
        inputElement && inputElement.addEventListener('keyup', onKeyUp)
      }

      return () => {
        inputElement && inputElement.removeEventListener('keyup', onKeyUp)
      }
    }, [isOpen, filteredOptions, onBlur, inputRef])

    useEffect(() => {
      const inputElement = inputRef.current

      const onKeyUp = (e: KeyboardEvent) => {
        e.stopPropagation()

        if (e.code === 'Enter') {
          pipe(
            highlightedItem,
            option.fold(constVoid, highlightedItem => {
              const label = filteredOptions[highlightedItem]
              setLabel(label)
              notifyChange(label)
              onBlur()
            })
          )
        }
      }

      if (isOpen && option.isSome(highlightedItem)) {
        inputElement && inputElement.addEventListener('keyup', onKeyUp)
      }

      return () => {
        inputElement && inputElement.removeEventListener('keyup', onKeyUp)
      }
    }, [
      isOpen,
      filteredOptions,
      highlightedItem,
      notifyChange,
      onBlur,
      inputRef
    ])

    useEffect(() => {
      if (!props.value) {
        return
      }

      pipe(
        Object.entries(options).find(([key]) => key === props.value),
        option.fromNullable,
        option.map(([, value]) => value),
        option.getOrElse(() => ''),
        setLabel
      )

      setHighlightedItem(option.none)
    }, [props.value, options])

    const optionItems = pipe(
      filteredOptions,
      record.mapWithIndex((value, label) => ({
        key: value,
        label: option.none,
        content: label,
        description: option.none,
        className: pipe(
          highlightedItem,
          option.fold(constUndefined, highlightedItem =>
            highlightedItem === value ? 'highlighted' : undefined
          )
        ),
        action: () => {
          setLabel(label)
          notifyChange(label)
          setHighlightedItem(option.none)
        }
      })),
      Object.values
    )

    return (
      <div className={composeClassName('Select', className, openClassName)}>
        <div className="input">
          <Input
            {...props}
            ref={inputRef}
            value={label}
            onChange={onInputChange}
            onFocus={onFocus}
            onBlur={onBlur}
            autoComplete="none"
            readOnly={unsearchable}
            disabled={disabled}
          />
          <Icon
            className="arrowIcon"
            src={caretDownSharp}
            size="small"
            color={iconColor}
          />
        </div>
        <div className="options">
          <List type="routed" heading={option.none} items={optionItems} />
        </div>
      </div>
    )
  }
)
