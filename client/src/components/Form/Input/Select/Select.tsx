import { array, boolean, option, record } from 'fp-ts'
import { constUndefined, constVoid, flow, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { caretDownSharp } from 'ionicons/icons'
import { FC, FocusEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Color, LocalizedString } from '../../../../globalDomain'
import { composeClassName } from '../../../../misc/composeClassName'
import { Button } from '../../../Button/Button/Button'
import { List } from '../../../List/List'
import { FieldProps } from '../../useForm'
import { Input } from '../Input/Input'
import './Select.scss'

interface Props extends FieldProps {
  label: LocalizedString
  options: Record<string, LocalizedString>
  onFocus?: (e: FocusEvent) => void
  onBlur?: (e: FocusEvent) => void
  unsearchable?: boolean
}

export const Select: FC<Props> = ({ unsearchable = false, ...props }) => {
  const [isFocus, setIsFocus] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedItem, setHighlightedItem] = useState<Option<string>>(
    option.none
  )

  const [label, setLabel] = useState(
    pipe(
      Object.entries(props.options).find(([key]) => key === props.value),
      option.fromNullable,
      option.map(([, value]) => value),
      option.getOrElse(() => '')
    )
  )

  const regex = new RegExp(label, 'i')
  const filteredOptions: Record<string, LocalizedString> = pipe(
    unsearchable,
    boolean.fold(
      () =>
        pipe(
          props.options,
          record.filter(label => regex.test(label))
        ),
      () => props.options
    )
  )

  const inputRef = useRef<HTMLInputElement>(null)

  const notifyChange = useCallback(
    (label: string): void => {
      pipe(
        Object.entries(props.options).find(([, value]) => value === label),
        option.fromNullable,
        option.map(([key]) => key),
        option.fold(constVoid, props.onChange)
      )
    },
    [props.options, props.onChange]
  )

  const onFocus = (e: FocusEvent) => {
    props.onFocus?.(e)
    setIsFocus(true)
    setIsOpen(true)
    inputRef.current && inputRef.current.focus()
  }

  const onBlur = (e: FocusEvent) => {
    if (record.size(filteredOptions) === 1) {
      const label = Object.values(filteredOptions)[0]
      setLabel(label)
      notifyChange(label)
      setHighlightedItem(option.none)
    }

    window.setTimeout(() => {
      props.onBlur?.(e)
      setIsFocus(false)
      setIsOpen(false)
    }, 150)
  }

  const onInputChange = (input: string) => {
    setLabel(input)
    setIsOpen(true)
    setHighlightedItem(option.none)

    pipe(
      Object.entries(props.options).find(([, value]) => value === input),
      option.fromNullable,
      option.map(([key]) => key),
      option.getOrElse(() => ''),
      props.onChange
    )
  }

  const onSelectArrowClick = () => {
    if (isOpen) {
      setIsOpen(false)
    } else {
      setIsOpen(true)
      inputRef.current && inputRef.current.focus()
    }
  }

  const iconColor: Color = pipe(
    props.error,
    option.fold(
      () =>
        pipe(
          isFocus,
          boolean.fold(
            () => 'default',
            () => 'primary'
          )
        ),
      () => 'danger'
    )
  )

  const focusClassName = isFocus ? 'focus' : ''
  const openClassName = isOpen ? 'open' : ''

  useEffect(() => {
    const inputElement = inputRef.current

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        setIsOpen(false)
        setHighlightedItem(option.none)
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
  }, [isOpen, filteredOptions])

  useEffect(() => {
    const inputElement = inputRef.current

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Enter') {
        pipe(
          highlightedItem,
          option.fold(constVoid, highlightedItem => {
            const label = filteredOptions[highlightedItem]
            setLabel(label)
            notifyChange(label)
            setIsOpen(false)
            setHighlightedItem(option.none)
          })
        )
      }
    }

    pipe(
      highlightedItem,
      option.fold(
        constVoid,
        () => inputElement && inputElement.addEventListener('keyup', onKeyUp)
      )
    )

    return () => {
      inputElement && inputElement.removeEventListener('keyup', onKeyUp)
    }
  }, [filteredOptions, highlightedItem, notifyChange])

  useEffect(() => {
    if (!props.value) {
      return
    }

    pipe(
      Object.entries(props.options).find(([key]) => key === props.value),
      option.fromNullable,
      option.map(([, value]) => value),
      option.getOrElse(() => ''),
      setLabel
    )

    setHighlightedItem(option.none)
  }, [props.value, props.options])

  return (
    <div className={composeClassName('Select', openClassName, focusClassName)}>
      <div className="input">
        <Input
          {...props}
          ref={inputRef}
          value={label}
          onChange={onInputChange}
          onFocus={onFocus}
          onBlur={onBlur}
          autoComplete="off"
          readOnly={unsearchable}
        />
        <Button
          type="iconButton"
          color={iconColor}
          icon={caretDownSharp}
          size="small"
          flat
          action={onSelectArrowClick}
        />
      </div>
      <div className="options">
        <List
          type="routed"
          heading={option.none}
          items={pipe(
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
          )}
        />
      </div>
    </div>
  )
}
