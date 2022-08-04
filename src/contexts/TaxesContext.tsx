import * as t from 'io-ts'
import { option, readerTaskEither, taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { createContext, PropsWithChildren, useContext, useEffect } from 'react'
import { query } from '../effects/api/api'
import { Query } from '../effects/api/Query'
import {
  makeDeleteRequest,
  makeGetRequest,
  makePostRequest,
  makePutRequest,
  usePost,
  useReactiveCommand
} from '../effects/api/useApi'
import { Tax, TaxCreationInput, TaxUpdateInput } from '../entities/Tax'
import {
  LocalizedString,
  ObjectId,
  unsafePositiveInteger
} from '../globalDomain'
import {
  addToConnection,
  Connection,
  ConnectionQueryInput,
  deleteFromConnection,
  getConnectionNodes,
  updateConnection
} from '../misc/Connection'
import { Reader } from 'fp-ts/Reader'
import { useAccount } from './AccountContext'

interface TaxesContext {
  taxes: Query<LocalizedString, Tax[]>
  createTax: ReaderTaskEither<TaxCreationInput, LocalizedString, void>
  updateTax: Reader<
    ObjectId,
    ReaderTaskEither<TaxUpdateInput, LocalizedString, void>
  >
  deleteTax: ReaderTaskEither<ObjectId, LocalizedString, void>
}

const TaxesContext = createContext<TaxesContext>({
  taxes: query.loading(),
  createTax: readerTaskEither.fromIO(constVoid),
  updateTax: () => readerTaskEither.fromIO(constVoid),
  deleteTax: () => taskEither.fromIO(constVoid)
})

export function useTaxes() {
  return useContext(TaxesContext)
}

const getTaxesRequest = makeGetRequest({
  url: '/taxes',
  inputCodec: ConnectionQueryInput,
  outputCodec: Connection(Tax)
})

const createTaxRequest = makePostRequest({
  url: '/taxes',
  inputCodec: TaxCreationInput,
  outputCodec: Tax
})

const makeUpdateTaxRequest = (_id: ObjectId) =>
  makePutRequest({
    url: `/taxes/${_id}`,
    inputCodec: TaxUpdateInput,
    outputCodec: Tax
  })

const makeDeleteTaxRequest = (_id: ObjectId) =>
  makeDeleteRequest({
    url: `/taxes/${_id}`,
    inputCodec: t.void,
    outputCodec: Tax
  })

export function TaxesProvider(props: PropsWithChildren<{}>) {
  const { withLogin } = useAccount()
  const createTaxCommand = usePost(createTaxRequest)

  const [taxesConnection, setTaxesConnection, fetchTaxes] =
    useReactiveCommand(getTaxesRequest)

  const taxes = pipe(taxesConnection, query.map(getConnectionNodes))

  const createTax: ReaderTaskEither<TaxCreationInput, LocalizedString, void> =
    pipe(
      createTaxCommand,
      readerTaskEither.chain(tax =>
        readerTaskEither.fromIO(() => {
          pipe(
            taxesConnection,
            query.chain(connection =>
              query.fromIO(() =>
                pipe(addToConnection(connection, tax), setTaxesConnection)
              )
            )
          )
        })
      )
    )

  const updateTax: Reader<
    ObjectId,
    ReaderTaskEither<TaxUpdateInput, LocalizedString, void>
  > = _id => {
    const updateTaxCommand = makeUpdateTaxRequest(_id)

    return input =>
      pipe(
        withLogin(updateTaxCommand, input),
        taskEither.chain(updatedTax =>
          taskEither.fromIO(() => {
            pipe(
              taxesConnection,
              query.chain(connection =>
                query.fromIO(() =>
                  pipe(
                    updateConnection(connection, updatedTax),
                    setTaxesConnection
                  )
                )
              )
            )
          })
        )
      )
  }

  const deleteTax: ReaderTaskEither<ObjectId, LocalizedString, void> = _id => {
    const deleteTaxCommand = makeDeleteTaxRequest(_id)

    return pipe(
      withLogin(deleteTaxCommand, void 0),
      taskEither.chain(deletedTax =>
        taskEither.fromIO(() => {
          pipe(
            taxesConnection,
            query.chain(connection =>
              query.fromIO(() =>
                pipe(
                  deleteFromConnection(connection, deletedTax),
                  setTaxesConnection
                )
              )
            )
          )
        })
      )
    )
  }

  useEffect(() => {
    fetchTaxes({
      query: option.none,
      first: unsafePositiveInteger(1000),
      after: option.none
    })()
  }, [fetchTaxes])

  return (
    <TaxesContext.Provider value={{ taxes, createTax, updateTax, deleteTax }}>
      {props.children}
    </TaxesContext.Provider>
  )
}
