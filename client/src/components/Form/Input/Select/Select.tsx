import { array, boolean, either, nonEmptyArray, option, record } from 'fp-ts'
import {
  constFalse,
  constTrue,
  constUndefined,
  constVoid,
  flow,
  identity,
  pipe
} from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { caretDownSharp } from 'ionicons/icons'
import {
  Dispatch,
  FocusEvent,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import { ReactRef, useCombinedRefs } from '../../../../effects/useCombinedRef'
import { Color, LocalizedString } from '../../../../globalDomain'
import { composeClassName } from '../../../../misc/composeClassName'
import { Icon } from '../../../Icon/Icon'
import { List, RoutedItem } from '../../../List/List'
import { FieldProps } from '../../useForm'
import { Input } from '../Input/Input'
import { Loading } from '../../../Loading/Loading'
import './Select.scss'
import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import * as t from 'io-ts'

type Index = string | number | symbol

export type SelectState<T extends Index> = [Option<T>, LocalizedString]

export function toSelectState<T extends Index>(
  options: Record<T, LocalizedString>,
  value: Option<T>
): SelectState<T> {
  return [
    value,
    pipe(
      value,
      option.map(value => options[value]),
      option.getOrElse(() => '' as LocalizedString)
    )
  ]
}

export function useSelectState<T extends Index>(
  options: Record<T, LocalizedString>,
  initialValue: Option<T>
): [SelectState<T>, Dispatch<SetStateAction<SelectState<T>>>] {
  return useState(toSelectState(options, initialValue))
}

export function getOptionValue<T extends Index>(
  option: SelectState<T>
): Option<T> {
  return option[0]
}

export function getOptionLabel<T extends Index>(
  option: SelectState<T>
): LocalizedString {
  return option[1]
}

interface CommonSelectProps<T extends Index>
  extends FieldProps<SelectState<T>> {
  label: LocalizedString
  className?: string
  onFocus?: (e: FocusEvent) => void
  onBlur?: (e: FocusEvent) => void
  disabled?: boolean
  children?: ReactNode
  ref?: ReactRef<HTMLInputElement>
  codec: t.Type<T, string, unknown>
}

export interface DefaultSelectProps<T extends Index>
  extends CommonSelectProps<T> {
  type: 'default'
  emptyPlaceholder: LocalizedString
  options: Record<T, LocalizedString>
}

export interface UnsearchableSelectProps<T extends Index>
  extends CommonSelectProps<T> {
  type: 'unsearchable'
  options: Record<T, LocalizedString>
}

export interface AsyncSelectProps<T extends Index>
  extends CommonSelectProps<T> {
  type: 'async'
  emptyPlaceholder: LocalizedString
  onQueryChange: (query: string) => void
  isLoading: boolean
  options: Partial<Record<T, LocalizedString>>
}

export type SelectProps<T extends Index> =
  | DefaultSelectProps<T>
  | UnsearchableSelectProps<T>
  | AsyncSelectProps<T>

function foldSelectProps<T extends Index, O>(
  whenDefault: (props: DefaultSelectProps<T>) => O,
  whenUnsearchable: (props: UnsearchableSelectProps<T>) => O,
  whenAsync: (props: AsyncSelectProps<T>) => O
): (props: SelectProps<T>) => O {
  return props => {
    switch (props.type) {
      case 'default':
        return whenDefault(props)
      case 'unsearchable':
        return whenUnsearchable(props)
      case 'async':
        return whenAsync(props)
    }
  }
}

export function Select<T extends Index>({
  className = '',
  ...props
}: SelectProps<T>) {
  const { onChange, onBlur: onBlurProp } = props
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedItem, setHighlightedItem] = useState<Option<string>>(
    option.none
  )
  const innerRef = useRef<HTMLInputElement>(null)
  const inputRef = useCombinedRefs(innerRef, props.ref || null)

  const options = pipe(
    props,
    foldSelectProps(
      ({ options }) => {
        const regex = new RegExp(getOptionLabel(props.value), 'i')

        return pipe(
          options,
          record.filter(label => regex.test(label))
        ) as Record<T, LocalizedString>
      },
      () => props.options,
      () => props.options
    )
  )

  const onInputChange = (input: LocalizedString): void => {
    setIsOpen(true)
    setHighlightedItem(option.none)

    pipe(
      Object.entries(options) as [string, LocalizedString][],
      array.findFirst(([, label]) => label === input),
      option.fold<[string, LocalizedString], [Option<T>, LocalizedString]>(
        () => [option.none, input],
        ([value, label]) =>
          pipe(
            value,
            props.codec.decode,
            either.fold(
              () => [option.none, input],
              value => [option.some(value), label]
            )
          )
      ),
      props.onChange
    )

    pipe(
      props,
      foldSelectProps(constVoid, constVoid, ({ onQueryChange }) =>
        onQueryChange(input)
      )
    )
  }

  const onFocus = (e?: FocusEvent) => {
    e && props.onFocus?.(e)
    setIsOpen(true)

    pipe(
      props,
      foldSelectProps(
        () => inputRef.current?.select(),
        constVoid,
        () => inputRef.current?.select()
      )
    )
  }

  const onBlur = useCallback(
    (e?: FocusEvent) => {
      setHighlightedItem(option.none)

      if (record.size(options) === 1) {
        const [[value, label]] = Object.entries(options) as [
          [T, LocalizedString]
        ]

        pipe(
          value,
          props.codec.decode,
          either.fold(constVoid, value => onChange([option.some(value), label]))
        )
      }

      window.setTimeout(() => {
        e && onBlurProp?.(e)
        setIsOpen(false)
      }, 150)
    },
    [options, onChange, onBlurProp, props.codec]
  )

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
      e.preventDefault()
      e.stopPropagation()

      if (e.code === 'Escape') {
        onBlur()
      } else if (e.code === 'ArrowDown') {
        const items = Object.keys(options)

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
        const items = Object.keys(options)

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
  }, [inputRef, isOpen, onBlur, options])

  useEffect(() => {
    const inputElement = inputRef.current

    const onKeyUp = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (e.code === 'Enter') {
        pipe(
          highlightedItem,
          option.fold(constVoid, highlightedItem => {
            pipe(
              highlightedItem,
              props.codec.decode,
              either.fold(constVoid, value =>
                onChange([option.some(value), options[value]!])
              )
            )

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
    options,
    highlightedItem,
    onChange,
    onBlur,
    inputRef,
    props.codec
  ])

  const optionItems: RoutedItem[] = pipe(
    Object.entries(options) as [string, LocalizedString][],
    array.map(([value, label]) => ({
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
        pipe(
          value,
          props.codec.decode,
          either.fold(constVoid, value =>
            props.onChange([option.some(value), label])
          )
        )

        setHighlightedItem(option.none)
      }
    })),
    nonEmptyArray.fromArray,
    option.fold<NonEmptyArray<RoutedItem>, RoutedItem[]>(() => {
      const getEmptyItem = (content: LocalizedString): RoutedItem => ({
        key: '',
        label: option.none,
        content,
        description: option.none,
        className: 'empty',
        action: constVoid
      })

      return pipe(
        props,
        foldSelectProps(
          ({ emptyPlaceholder }) => [getEmptyItem(emptyPlaceholder)],
          () => [],
          ({ emptyPlaceholder }) => [getEmptyItem(emptyPlaceholder)]
        )
      )
    }, identity)
  )

  return (
    <div className={composeClassName('Select', className, openClassName)}>
      <div className="input">
        <Input
          name={props.name}
          label={props.label}
          ref={inputRef}
          value={getOptionLabel(props.value)}
          onChange={input => onInputChange(input as LocalizedString)}
          onFocus={onFocus}
          onBlur={onBlur}
          autoComplete="off"
          readOnly={pipe(
            props,
            foldSelectProps(constFalse, constTrue, constFalse)
          )}
          disabled={props.disabled}
          error={props.error}
          warning={props.warning}
        >
          {props.children}
          {pipe(
            props,
            foldSelectProps(
              constFalse,
              constFalse,
              ({ isLoading }) => !!isLoading
            ),
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
        </Input>
      </div>
      <div className="options">
        <List type="routed" heading={option.none} items={optionItems} />
      </div>
    </div>
  )
}
