import { option, record, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { sequenceS } from 'fp-ts/Apply'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import { Reducer, useReducer } from 'react'
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

type FieldValidators<Values> = {
  [k in keyof Values]: Validator<Values[k], unknown>
}

type FieldLinters<Values> = Partial<
  {
    [k in keyof Values]: Linter<Values[k]>
  }
>

type ValidatedFields<
  Values,
  Validators extends Partial<FieldValidators<Values>>
> = {
  [k in keyof Values]: Validators[k] extends Validator<Values[k], infer O>
    ? O
    : Validators[k] extends Validator<Values[k], infer O> | undefined
    ? O | Values[k]
    : Values[k]
}

type UseFormInput<
  Values,
  Validators extends Partial<FieldValidators<Values>>,
  Linters extends FieldLinters<Values>,
  FormValidator extends Validator<ValidatedFields<Values, Validators>, unknown>
> = [
  {
    initialValues: Values
    validators: (values: Values) => Validators
    linters: (values: Values) => Linters
  },
  { formValidator: FormValidator },
  {
    onSubmit: (
      values: FormValidator extends undefined
        ? ValidatedFields<Values, Validators>
        : ValidatorOutput<NonNullable<FormValidator>>
    ) => TaskEither<unknown, unknown>
  }
]

type UseFormInputNoFormValidator<
  Values,
  Validators extends Partial<FieldValidators<Values>>,
  Linters extends FieldLinters<Values>
> = [
  {
    initialValues: Values
    validators: (values: Values) => Validators
    linters: (values: Values) => Linters
  },
  {
    onSubmit: (
      values: ValidatedFields<Values, Validators>
    ) => TaskEither<unknown, unknown>
  }
]

interface UseFormOutput<Values extends Record<string, unknown>> {
  fieldProps: <K extends keyof Values & string>(
    name: K
  ) => FieldProps<Values[K]>
  values: Values
  formError: Option<LocalizedString>
  submit: TaskEither<unknown, unknown>
  setValues: (values: Partial<Values>) => void
}

interface FormState<Values> {
  values: Values
  errors: Record<keyof Values, Option<LocalizedString>>
  warnings: Record<keyof Values, Option<LocalizedString>>
  formError: Option<LocalizedString>
}

type FormAction<Values> =
  | {
      type: 'setValues'
      values: Partial<Values>
    }
  | {
      type: 'setErrors'
      errors: Record<keyof Values, Option<LocalizedString>>
    }
  | {
      type: 'setWarnings'
      warnings: Record<keyof Values, Option<LocalizedString>>
    }
  | {
      type: 'setFormError'
      error: Option<LocalizedString>
    }

function formReducer<Values>(
  state: FormState<Values>,
  action: FormAction<Values>
): FormState<Values> {
  switch (action.type) {
    case 'setValues':
      return {
        ...state,
        values: {
          ...state.values,
          ...action.values
        }
      }
    case 'setErrors':
      return {
        ...state,
        errors: {
          ...state.errors,
          ...action.errors
        }
      }
    case 'setWarnings':
      return {
        ...state,
        warnings: {
          ...state.warnings,
          ...action.warnings
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
  ...args: UseFormInputNoFormValidator<Values, Validators, Linters>
): UseFormOutput<Values>
export function useForm<
  Values extends Record<string, unknown>,
  Validators extends Partial<FieldValidators<Values>>,
  Linters extends FieldLinters<Values>,
  FormValidator extends Validator<ValidatedFields<Values, Validators>, unknown>
>(
  ...args: UseFormInput<Values, Validators, Linters, FormValidator>
): UseFormOutput<Values>
export function useForm<
  Values extends Record<string, unknown>,
  Validators extends Partial<FieldValidators<Values>>,
  Linters extends FieldLinters<Values>,
  FormValidator extends
    | Validator<ValidatedFields<Values, Validators>, unknown>
    | undefined
>(
  ...args:
    | UseFormInput<Values, Validators, Linters, NonNullable<FormValidator>>
    | UseFormInputNoFormValidator<Values, Validators, Linters>
): UseFormOutput<Values> {
  const {
    initialValues,
    validators: validatorsFactory,
    linters: lintersFactory
  } = args[0]

  const { formValidator, onSubmit } = (() => {
    if (args.length === 2) {
      return {
        formValidator: undefined,
        onSubmit: args[1].onSubmit
      }
    } else {
      return {
        formValidator: args[1].formValidator,
        onSubmit: args[2].onSubmit
      }
    }
  })()

  const [{ values, errors, warnings, formError }, dispatch] = useReducer<
    Reducer<FormState<Values>, FormAction<Values>>
  >(formReducer, {
    values: initialValues,
    errors: pipe(
      initialValues,
      record.map(() => option.none)
    ) as Record<keyof Values, Option<LocalizedString>>,
    warnings: pipe(
      initialValues,
      record.map(() => option.none)
    ) as Record<keyof Values, Option<LocalizedString>>,
    formError: option.none
  })

  const validators = validatorsFactory(values)
  const linters = lintersFactory(values)

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
          dispatch({
            type: 'setErrors',
            errors: { [name]: option.some(error) } as Record<
              keyof Values,
              Option<LocalizedString>
            >
          })

          return error
        },
        value => {
          dispatch({
            type: 'setErrors',
            errors: { [name]: option.none } as Record<
              keyof Values,
              Option<LocalizedString>
            >
          })

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
          type: 'setWarnings',
          warnings: {
            [name]: warning
          } as Record<keyof Values, Option<LocalizedString>>
        })
    )
  }

  const setValues: UseFormOutput<Values>['setValues'] = values =>
    dispatch({
      type: 'setValues',
      values
    })

  const setValue = <K extends keyof Values & string>(name: K) => (
    value: Values[K]
  ) => {
    dispatch({
      type: 'setValues',
      values: ({
        [name]: value
      } as unknown) as Partial<Values>
    })

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
    value: values[name],
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
        validateField(name, values[name])
      ),
      sequenceS(taskEither.taskEither),
      taskEither.map(values => values as ValidatedFields<Values, Validators>)
    )
  }

  const validateForm = (
    values: ValidatedFields<Values, Validators>
  ): TaskEither<
    LocalizedString,
    | ValidatorOutput<NonNullable<FormValidator>>
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

              return output as ValidatorOutput<NonNullable<FormValidator>>
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
    values,
    fieldProps,
    formError,
    submit,
    setValues
  }
}
