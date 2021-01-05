import {
  array,
  boolean,
  nonEmptyArray,
  option,
  record,
  taskEither
} from 'fp-ts'
import { constUndefined, constVoid, flow, identity, pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
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
import { List, RoutedItem } from '../../../List/List'
import { FieldProps } from '../../useForm'
import { Input } from '../Input/Input'
import './Select.scss'
import { Loading } from '../../../Loading/Loading'
import { a18n } from '../../../../a18n'

type FindOptions = (
  query: string,
  options: Record<string, LocalizedString>
) => TaskEither<LocalizedString, Record<string, LocalizedString>>

const defaultEmptyPlaceholder = a18n`Nothing found here`
const defaultFindOptions: FindOptions = (query, options) => {
  const regex = new RegExp(query, 'i')

  return pipe(
    options,
    record.filter(label => regex.test(label)),
    taskEither.right
  )
}

export interface SelectProps extends FieldProps {
  className?: string
  label: LocalizedString
  options: Record<string, LocalizedString>
  onFocus?: (e: FocusEvent) => void
  onBlur?: (e: FocusEvent) => void
  findOptions?: FindOptions
  emptyPlaceholder?: LocalizedString
  unsearchable?: boolean
  disabled?: boolean
  children?: ReactNode
}

// TODO: add placeholder
// TODO: show something when nothing is found (maybe a prop)
export const Select = forwardRef<HTMLInputElement, SelectProps>(
  (
    {
      unsearchable = false,
      options,
      onBlur: onBlurProp,
      className = '',
      disabled = false,
      findOptions = defaultFindOptions,
      emptyPlaceholder = defaultEmptyPlaceholder,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
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

    const [filteredOptions, setFilteredOptions] = useState(options)

    const innerRef = useRef<HTMLInputElement>(null)
    const inputRef = useCombinedRefs(innerRef, ref)

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
      !unsearchable && inputRef.current?.select()
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

    useEffect(() => {
      if (props.value) {
        return
      }

      setIsLoading(true)

      pipe(
        unsearchable,
        boolean.fold(
          () => findOptions(label, options),
          () => taskEither.right(options)
        ),
        taskEither.chain(filteredOptions =>
          taskEither.fromIO(() => {
            setIsLoading(false)
            setFilteredOptions(filteredOptions)
          })
        )
      )()
    }, [label, props.value, findOptions, options, unsearchable])

    const optionItems: RoutedItem[] = pipe(
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
      Object.values,
      nonEmptyArray.fromArray,
      option.fold(
        () => [
          {
            key: '',
            label: option.none,
            content: emptyPlaceholder,
            description: option.none,
            className: 'empty',
            action: constVoid
          }
        ],
        identity
      )
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
            autoComplete="nope"
            readOnly={unsearchable}
            disabled={disabled}
          />
          {pipe(
            isLoading,
            boolean.fold(
              () => (
                <Icon
                  className="arrowIcon"
                  src={caretDownSharp}
                  size="small"
                  color={iconColor}
                />
              ),
              () => <Loading size="small" color={iconColor} />
            )
          )}
        </div>
        <div className="options">
          <List type="routed" heading={option.none} items={optionItems} />
        </div>
      </div>
    )
  }
)
