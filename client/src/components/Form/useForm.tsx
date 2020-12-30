import { option, record, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { sequenceS } from 'fp-ts/lib/Apply'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import { useReducer } from 'react'
import { a18n } from '../../a18n'
import { LocalizedString } from '../../globalDomain'
import { Validator, ValidatorOutput } from './validators'

export interface FieldProps {
  name: string
  value: string
  onChange: (value: string) => void
  error: Option<LocalizedString>
  warning: Option<LocalizedString>
}

export type Linter = (input: string) => Option<LocalizedString>

type FieldValidators<Values extends Record<string, string>> = {
  [k in keyof Values]: Validator<string, unknown>
}

type FieldLinters<Values extends Record<string, string>> = Partial<
  {
    [k in keyof Values]: Linter
  }
>

type ValidatedFields<
  Values extends Record<string, string>,
  Validators extends FieldValidators<Values>
> = {
  [k in keyof Values]: ValidatorOutput<string, Validators[k]>
}

interface UseFormInput<
  Values extends Record<string, string>,
  Validators extends FieldValidators<Values>,
  Linters extends FieldLinters<Values>,
  FormValidator extends Validator<ValidatedFields<Values, Validators>, unknown>
> {
  initialValues: Values
  validators: Validators
  linters: Linters
  formValidator: FormValidator
  onSubmit: (
    values: ValidatorOutput<ValidatedFields<Values, Validators>, FormValidator>
  ) => TaskEither<unknown, unknown>
}

interface UseFormOutput<Values extends Record<string, string>> {
  fieldProps: (name: keyof Values & string) => FieldProps
  formError: Option<LocalizedString>
  submit: TaskEither<unknown, unknown>
  setValue: (name: keyof Values & string) => (value: string) => void
}

interface FormState<Values extends Record<string, string>> {
  values: Values
  errors: {
    [k in keyof Values]: Option<LocalizedString>
  }
  warnings: {
    [k in keyof Values]: Option<LocalizedString>
  }
  formError: Option<LocalizedString>
}

type FormAction<Values extends Record<string, string>> =
  | {
      type: 'setValue'
      name: keyof Values
      value: string
    }
  | {
      type: 'setError'
      name: keyof Values
      error: Option<LocalizedString>
    }
  | {
      type: 'setWarning'
      name: keyof Values
      warning: Option<LocalizedString>
    }
  | {
      type: 'setFormError'
      error: Option<LocalizedString>
    }

function formReducer<Values extends Record<string, string>>(
  state: FormState<Values>,
  action: FormAction<Values>
): FormState<Values> {
  switch (action.type) {
    case 'setValue':
      return {
        ...state,
        values: {
          ...state.values,
          [action.name]: action.value
        }
      }
    case 'setError':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.name]: action.error
        }
      }
    case 'setWarning':
      return {
        ...state,
        warnings: {
          ...state.warnings,
          [action.name]: action.warning
        }
      }
    case 'setFormError':
      return {
        ...state,
        formError: action.error
      }
  }
}

export function useForm<
  Values extends Record<string, string>,
  Validators extends FieldValidators<Values>,
  Linters extends FieldLinters<Values>,
  FormValidator extends Validator<ValidatedFields<Values, Validators>, unknown>
>({
  initialValues,
  validators,
  linters,
  formValidator,
  onSubmit
}: UseFormInput<
  Values,
  Validators,
  Linters,
  FormValidator
>): UseFormOutput<Values> {
  const [{ values, errors, warnings, formError }, dispatch] = useReducer(
    formReducer,
    {
      values: initialValues,
      errors: pipe(
        initialValues,
        record.map(() => option.none)
      ),
      warnings: pipe(
        initialValues,
        record.map(() => option.none)
      ),
      formError: option.none
    }
  )

  function validateField<K extends keyof Values & string>(
    name: K,
    value: string
  ): TaskEither<LocalizedString, unknown> {
    return pipe(
      validators[name](value),
      taskEither.bimap(
        error => {
          dispatch({ type: 'setError', name, error: option.some(error) })
          return error
        },
        value => {
          dispatch({ type: 'setError', name, error: option.none })
          return value
        }
      )
    )
  }

  function lintField<K extends keyof Values & string>(
    name: K,
    value: string
  ): void {
    return pipe(
      linters[name],
      option.fromNullable,
      option.fold(
        () => option.none,
        linter => linter(value)
      ),
      warning =>
        dispatch({
          type: 'setWarning',
          name,
          warning
        })
    )
  }

  const setValue: UseFormOutput<Values>['setValue'] = name => value => {
    dispatch({ type: 'setValue', name, value })
    dispatch({ type: 'setFormError', error: option.none })
    validateField(name, value)()
    lintField(name, value)
  }

  const fieldProps: UseFormOutput<Values>['fieldProps'] = name => ({
    name,
    value: values[name],
    error: errors[name],
    warning: warnings[name],
    onChange: setValue(name)
  })

  const submit: UseFormOutput<Values>['submit'] = pipe(
    values,
    record.mapWithIndex(name => validateField(name, values[name])),
    sequenceS(taskEither.taskEither),
    taskEither.mapLeft(
      () => a18n`Some fields are not valid. Please fix them before continuing`
    ),
    taskEither.chain(values =>
      formValidator(values as ValidatedFields<Values, Validators>)
    ),
    taskEither.bimap(
      error => {
        dispatch({ type: 'setFormError', error: option.some(error) })
      },
      values => {
        dispatch({ type: 'setFormError', error: option.none })

        return values as ValidatorOutput<
          ValidatedFields<Values, Validators>,
          FormValidator
        >
      }
    ),
    taskEither.chain(onSubmit)
  )

  return {
    fieldProps,
    formError,
    submit,
    setValue
  }
}
