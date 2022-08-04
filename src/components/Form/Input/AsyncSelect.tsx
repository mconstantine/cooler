import { taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { useEffect, useState } from 'react'
import { LocalizedString } from '../../../globalDomain'
import { AsyncSelectProps, Select } from './Select/Select'

interface Props<T extends string | number | symbol>
  extends Omit<
    AsyncSelectProps<T>,
    'type' | 'onQueryChange' | 'isLoading' | 'options'
  > {
  onQueryChange: (
    query: string
  ) => TaskEither<unknown, Record<T, LocalizedString>>
}

export function AsyncSelect<T extends string | number | symbol>({
  onQueryChange,
  ...props
}: Props<T>) {
  const [isLoading, setIsLoading] = useState(false)
  const [options, setOptions] = useState<Partial<Record<T, LocalizedString>>>(
    {}
  )

  useEffect(() => {
    pipe(onQueryChange(''), taskEither.bimap(constVoid, setOptions))()
  }, [onQueryChange])

  return (
    <Select
      type="async"
      {...props}
      options={options}
      isLoading={isLoading}
      onQueryChange={input => {
        setIsLoading(true)

        pipe(
          onQueryChange(input),
          taskEither.bimap(
            () => setIsLoading(false),
            options => {
              setIsLoading(false)
              setOptions(options)
            }
          )
        )()
      }}
    />
  )
}
