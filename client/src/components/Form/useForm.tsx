import { option, record, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { sequenceS } from 'fp-ts/lib/Apply'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import { useReducer } from 'react'
import { a18n } from '../../a18n'
import { LocalizedString } from '../../globalDomain'
import { Validator, ValidatorOutput } from './validators'

export interface FieldProps<T> {
  name: string
  value: T
  onChange: (value: T) => void
  error: Option<LocalizedString>
  warning: Option<LocalizedString>
}

export type Linter<T> = (input: T) => Option<LocalizedString>

type FieldValidators<Values extends Record<string, unknown>> = {
  [k in keyof Values]: Validator<Values[k], unknown>
}

type FieldLinters<Values extends Record<string, unknown>> = Partial<
  {
    [k in keyof Values]: Linter<Values[k]>
  }
>

type ValidatedFields<
  Values extends Record<string, unknown>,
  Validators extends Partial<FieldValidators<Values>>
> = {
  [k in keyof Values]: Validators[k] extends Validator<Values[k], infer O>
    ? O
    : Validators[k] extends Validator<Values[k], infer O> | undefined
    ? O | Values[k]
    : Values[k]
}

interface UseFormInput<
  Values extends Record<string, unknown>,
  Validators extends Partial<FieldValidators<Values>>,
  Linters extends FieldLinters<Values>,
  FormValidator extends
    | Validator<ValidatedFields<Values, Validators>, unknown>
    | undefined
> {
  initialValues: Values
  validators: Validators
  linters: Linters
  formValidator: FormValidator
  onSubmit: (
    values: FormValidator extends Validator<
      ValidatedFields<Values, Validators>,
      unknown
    >
      ? ValidatorOutput<ValidatedFields<Values, Validators>, FormValidator>
      : ValidatedFields<Values, Validators>
  ) => TaskEither<unknown, unknown>
}

interface UseFormInputNoFormValidator<
  Values extends Record<string, unknown>,
  Validators extends Partial<FieldValidators<Values>>,
  Linters extends FieldLinters<Values>
> {
  initialValues: Values
  validators: Validators
  linters: Linters
  onSubmit: (
    values: ValidatedFields<Values, Validators>
  ) => TaskEither<unknown, unknown>
}

interface UseFormOutput<Values extends Record<string, unknown>> {
  fieldProps: <K extends keyof Values & string>(
    name: K
  ) => FieldProps<Values[K]>
  formError: Option<LocalizedString>
  submit: TaskEither<unknown, unknown>
  setValue: <K extends keyof Values & string>(
    name: K
  ) => (value: Values[K]) => void
}

interface FormState<Values extends Record<string, unknown>> {
  values: Values
  errors: Record<keyof Values, Option<LocalizedString>>
  warnings: Record<keyof Values, Option<LocalizedString>>
  formError: Option<LocalizedString>
}

type FormAction<Values extends Record<string, unknown>> =
  | {
      type: 'setValue'
      name: keyof Values
      value: unknown
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

function formReducer<Values extends Record<string, unknown>>(
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
  Values extends Record<string, unknown>,
  Validators extends Partial<FieldValidators<Values>>,
  Linters extends FieldLinters<Values>
>(
  options: UseFormInputNoFormValidator<Values, Validators, Linters>
): UseFormOutput<Values>
export function useForm<
  Values extends Record<string, unknown>,
  Validators extends Partial<FieldValidators<Values>>,
  Linters extends FieldLinters<Values>,
  FormValidator extends
    | Validator<ValidatedFields<Values, Validators>, unknown>
    | undefined
>(
  options: UseFormInput<Values, Validators, Linters, FormValidator>
): UseFormOutput<Values>
export function useForm<
  Values extends Record<string, unknown>,
  Validators extends Partial<FieldValidators<Values>>,
  Linters extends FieldLinters<Values>,
  FormValidator extends
    | Validator<ValidatedFields<Values, Validators>, unknown>
    | undefined
>(
  options:
    | UseFormInput<Values, Validators, Linters, FormValidator>
    | UseFormInputNoFormValidator<Values, Validators, Linters>
): UseFormOutput<Values> {
  const { initialValues, validators, linters, onSubmit } = options

  const formValidator: FormValidator = (options as UseFormInput<
    Values,
    Validators,
    Linters,
    FormValidator
  >).formValidator

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
    value: Values[K]
  ): TaskEither<LocalizedString, unknown> {
    return pipe(
      validators[name],
      option.fromNullable,
      option.map(validator => validator(value)),
      option.getOrElse<TaskEither<LocalizedString, unknown>>(() =>
        taskEither.right(value)
      ),
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
    value: Values[K]
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

  const setValue: UseFormOutput<Values>['setValue'] = <
    K extends keyof Values & string
  >(
    name: K
  ) => (value: Values[K]) => {
    dispatch({ type: 'setValue', name, value })
    dispatch({ type: 'setFormError', error: option.none })
    validateField(name, value)()
    lintField(name, value)
  }

  const fieldProps: UseFormOutput<Values>['fieldProps'] = <
    K extends keyof Values & string
  >(
    name: K
  ) => ({
    name,
    value: values[name] as Values[K],
    error: errors[name],
    warning: warnings[name],
    onChange: setValue(name)
  })

  const validateAllFields = (
    values: Values
  ): TaskEither<LocalizedString, ValidatedFields<Values, Validators>> => {
    return pipe(
      values,
      record.mapWithIndex(<K extends keyof Values & string>(name: K) =>
        validateField(name, values[name] as Values[K])
      ),
      sequenceS(taskEither.taskEither),
      taskEither.map(values => values as ValidatedFields<Values, Validators>)
    )
  }

  const validateForm = (
    values: ValidatedFields<Values, Validators>
  ): TaskEither<
    LocalizedString,
    | ValidatorOutput<
        ValidatedFields<Values, Validators>,
        NonNullable<FormValidator>
      >
    | ValidatedFields<Values, Validators>
  > => {
    return pipe(
      formValidator,
      option.fromNullable,
      option.map(formValidator =>
        pipe(
          formValidator(values),
          taskEither.bimap(
            error => {
              dispatch({ type: 'setFormError', error: option.some(error) })
              return error
            },
            output => {
              dispatch({ type: 'setFormError', error: option.none })
              return output as ValidatorOutput<
                ValidatedFields<Values, Validators>,
                NonNullable<FormValidator>
              >
            }
          )
        )
      ),
      option.getOrElseW(() =>
        taskEither.rightIO(() => {
          dispatch({ type: 'setFormError', error: option.none })
          return values
        })
      )
    )
  }

  const submit: UseFormOutput<Values>['submit'] = pipe(
    validateAllFields(values as Values),
    taskEither.mapLeft(
      () => a18n`Some fields are not valid. Please fix them before continuing`
    ),
    taskEither.chain(validateForm),
    taskEither.chainFirstW(values => onSubmit(values as any))
  )

  return {
    fieldProps,
    formError,
    submit,
    setValue
  }
}
