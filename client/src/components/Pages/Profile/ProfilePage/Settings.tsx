import { taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { FC } from 'react'
import { useMutation } from '../../../../effects/useMutation'
import { foldQuery, UseQueryOutput } from '../../../../effects/useQuery'
import { Tax, TaxCreationInput } from '../../../../entities/Tax'
import { LocalizedString } from '../../../../globalDomain'
import {
  addToConnection,
  deleteFromConnection,
  getConnectionNodes,
  updateConnection
} from '../../../../misc/graphql'
import { ErrorPanel } from '../../../ErrorPanel/ErrorPanel'
import { LoadingBlock } from '../../../Loading/LoadingBlock'
import {
  createTaxMutation,
  deleteTaxMutation,
  ProfileQueryInput,
  ProfileQueryOutput,
  updateTaxMutation
} from './domain'
import { TaxesListForm } from './TaxesListForm'

interface Props {
  query: UseQueryOutput<ProfileQueryInput, ProfileQueryOutput>
}

export const Settings: FC<Props> = props => {
  const { query, update } = props.query
  const createTax = useMutation(createTaxMutation)
  const updateTax = useMutation(updateTaxMutation)
  const deleteTax = useMutation(deleteTaxMutation)

  const onTaxAdd: ReaderTaskEither<
    TaxCreationInput,
    LocalizedString,
    void
  > = tax =>
    pipe(
      createTax({ tax }),
      taskEither.mapLeft(error => error.message),
      taskEither.chain(({ createTax }) =>
        taskEither.fromIO(() =>
          update(({ me }) => ({
            me: {
              ...me,
              taxes: addToConnection(me.taxes, createTax)
            }
          }))
        )
      )
    )

  const onTaxUpdate: ReaderTaskEither<Tax, LocalizedString, void> = tax =>
    pipe(
      updateTax({
        id: tax.id,
        tax: {
          label: tax.label,
          value: tax.value
        }
      }),
      taskEither.mapLeft(error => error.message),
      taskEither.chain(({ updateTax }) =>
        taskEither.fromIO(() =>
          update(({ me }) => ({
            me: {
              ...me,
              taxes: updateConnection(me.taxes, updateTax)
            }
          }))
        )
      )
    )

  const onTaxDelete: ReaderTaskEither<Tax, LocalizedString, void> = tax =>
    pipe(
      deleteTax({ id: tax.id }),
      taskEither.mapLeft(error => error.message),
      taskEither.chain(({ deleteTax }) =>
        taskEither.fromIO(() =>
          update(({ me }) => ({
            me: {
              ...me,
              taxes: deleteFromConnection(me.taxes, deleteTax)
            }
          }))
        )
      )
    )

  return pipe(
    query,
    foldQuery(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error.message} />,
      ({ me }) => (
        <TaxesListForm
          taxes={getConnectionNodes(me.taxes)}
          onTaxAdd={onTaxAdd}
          onTaxUpdate={onTaxUpdate}
          onTaxDelete={onTaxDelete}
        />
      )
    )
  )
}
