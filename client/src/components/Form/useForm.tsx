import { option, record, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { sequenceS } from 'fp-ts/lib/Apply'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import { useReducer } from 'react'
import { LocalizedString } from '../../globalDomain'
import { InputProps } from './Input/Input/Input'
import { Validator, ValidatorOutput } from './validators'

interface FieldProps
  extends Pick<InputProps, 'name' | 'value' | 'onChange' | 'error'> {}

type FieldValidators<Values extends Record<string, string>> = {
  [k in keyof Values]: Validator<string, unknown>
}

type ValidatedFields<
  Values extends Record<string, string>,
  Validators extends FieldValidators<Values>
> = {
  [k in keyof Values]: ValidatorOutput<string, Validators[k]>
}

interface UseFormInput<
  Values extends Record<string, string>,
  Validators extends FieldValidators<Values>,
  FormValidator extends Validator<ValidatedFields<Values, Validators>, unknown>
> {
  initialValues: Values
  validators: Validators
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
  FormValidator extends Validator<ValidatedFields<Values, Validators>, unknown>
>({
  initialValues,
  validators,
  formValidator,
  onSubmit
}: UseFormInput<Values, Validators, FormValidator>): UseFormOutput<Values> {
  const [{ values, errors, formError }, dispatch] = useReducer(formReducer, {
    values: initialValues,
    errors: pipe(
      initialValues,
      record.map(() => option.none)
    ),
    formError: option.none
  })

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

  const setValue: UseFormOutput<Values>['setValue'] = name => value => {
    dispatch({ type: 'setValue', name, value })
    validateField(name, value)()
  }

  const fieldProps: UseFormOutput<Values>['fieldProps'] = name => ({
    name,
    value: values[name],
    error: errors[name],
    onChange: setValue(name)
  })

  const submit: UseFormOutput<Values>['submit'] = pipe(
    values,
    record.mapWithIndex(name => validateField(name, values[name])),
    sequenceS(taskEither.taskEither),
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
