import { option, taskEither } from 'fp-ts'
import { constNull, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { add, trash } from 'ionicons/icons'
import { FC, Reducer, useReducer } from 'react'
import { a18n } from '../../../../a18n'
import { useDialog } from '../../../../effects/useDialog'
import { Tax, TaxCreationInput } from '../../../../entities/Tax'
import { formatPercentarge, LocalizedString } from '../../../../globalDomain'
import { Card } from '../../../Card/Card'
import { TaxForm } from '../../../Form/Forms/TaxForm'
import { Heading, HeadingAction } from '../../../Heading/Heading'
import { Modal } from '../../../Modal/Modal'
import './TaxesListForm.scss'

interface Props {
  taxes: Tax[]
  onTaxAdd: ReaderTaskEither<TaxCreationInput, LocalizedString, unknown>
  onTaxUpdate: ReaderTaskEither<Tax, LocalizedString, unknown>
  onTaxDelete: ReaderTaskEither<Tax, LocalizedString, unknown>
}

interface ReadingState {
  type: 'reading'
}

interface AddingState {
  type: 'adding'
}

interface EditingState {
  type: 'editing'
  tax: Tax
}

type State = ReadingState | AddingState | EditingState

function foldState<T>(
  whenReading: (state: ReadingState) => T,
  whenAdding: (state: AddingState) => T,
  whenEditing: (state: EditingState) => T
): (state: State) => T {
  return state => {
    switch (state.type) {
      case 'reading':
        return whenReading(state)
      case 'adding':
        return whenAdding(state)
      case 'editing':
        return whenEditing(state)
    }
  }
}

type Action =
  | {
      type: 'add'
    }
  | {
      type: 'edit'
      tax: Tax
    }
  | {
      type: 'read'
    }

function reducer(state: State, action: Action): State {
  switch (state.type) {
    case 'reading':
      switch (action.type) {
        case 'read':
          return state
        case 'add':
          return {
            type: 'adding'
          }
        case 'edit':
          return {
            type: 'editing',
            tax: action.tax
          }
      }
    case 'adding':
      switch (action.type) {
        case 'read':
          return {
            type: 'reading'
          }
        case 'add':
        case 'edit':
          return state
      }
    case 'editing':
      switch (action.type) {
        case 'read':
          return {
            type: 'reading'
          }
        case 'add':
        case 'edit':
          return state
      }
  }
}

export const TaxesListForm: FC<Props> = props => {
  const [state, dispatch] = useReducer<Reducer<State, Action>>(reducer, {
    type: 'reading'
  })

  const [DeleteDialog, deleteTax] = useDialog(props.onTaxDelete, {
    title: tax => a18n`Are you sure you want to delete "${tax.label}"?`,
    message: () => a18n`You will need to add it again to recover it's data`
  })

  const headingAction: Option<HeadingAction> = option.some({
    type: 'sync',
    label: a18n`Add new`,
    icon: option.some(add),
    action: () => dispatch({ type: 'add' })
  })

  const onTaxAdd = (tax: TaxCreationInput) => {
    return pipe(
      props.onTaxAdd(tax),
      taskEither.chain(() =>
        taskEither.fromIO(() => dispatch({ type: 'read' }))
      )
    )
  }

  const onTaxUpdate = (tax: Tax) => {
    return pipe(
      props.onTaxUpdate(tax),
      taskEither.chain(() =>
        taskEither.fromIO(() => dispatch({ type: 'read' }))
      )
    )
  }

  const onCancel = () =>
    dispatch({
      type: 'read'
    })

  return (
    <div className="TaxesListForm">
      <Heading size={27} action={headingAction}>{a18n`Taxes`}</Heading>
      {props.taxes.map(tax => (
        <Card
          key={tax.id}
          label={option.none}
          content={tax.label}
          description={option.some(formatPercentarge(tax.value))}
          actions={[
            {
              type: 'sync',
              label: a18n`Edit`,
              action: () => dispatch({ type: 'edit', tax })
            },
            {
              type: 'async',
              label: a18n`Delete`,
              action: deleteTax(tax),
              icon: trash,
              color: 'danger'
            }
          ]}
        />
      ))}
      {pipe(
        state,
        foldState(
          constNull,
          () => (
            <Modal isOpen={true} onClose={() => dispatch({ type: 'read' })}>
              <TaxForm
                tax={option.none}
                onSubmit={onTaxAdd}
                onCancel={option.some(onCancel)}
              />
            </Modal>
          ),
          state => (
            <Modal isOpen={true} onClose={() => dispatch({ type: 'read' })}>
              <TaxForm
                tax={option.some(state.tax)}
                onSubmit={data => onTaxUpdate({ ...state.tax, ...data })}
                onCancel={option.some(onCancel)}
              />
            </Modal>
          )
        )
      )}
      <DeleteDialog />
    </div>
  )
}
