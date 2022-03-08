import * as t from 'io-ts'
import { option, readerTaskEither, taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { createContext, PropsWithChildren, useContext, useEffect } from 'react'
import { query } from '../effects/api/api'
import { Query } from '../effects/api/Query'
import {
  CoolerError,
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
  PositiveInteger,
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
  taxes: Query<CoolerError, Tax[]>
  createTax: ReaderTaskEither<TaxCreationInput, LocalizedString, void>
  updateTax: Reader<
    PositiveInteger,
    ReaderTaskEither<TaxUpdateInput, LocalizedString, void>
  >
  deleteTax: ReaderTaskEither<PositiveInteger, LocalizedString, void>
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

const makeUpdateTaxRequest = (id: PositiveInteger) =>
  makePutRequest({
    url: `/taxes/${id}`,
    inputCodec: TaxUpdateInput,
    outputCodec: Tax
  })

const makeDeleteTaxRequest = (id: PositiveInteger) =>
  makeDeleteRequest({
    url: `/taxes/${id}`,
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
      ),
      readerTaskEither.mapLeft(error => error.message)
    )

  const updateTax: Reader<
    PositiveInteger,
    ReaderTaskEither<TaxUpdateInput, LocalizedString, void>
  > = id => {
    const updateTaxCommand = makeUpdateTaxRequest(id)

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
        ),
        taskEither.mapLeft(error => error.message)
      )
  }

  const deleteTax: ReaderTaskEither<
    PositiveInteger,
    LocalizedString,
    void
  > = id => {
    const deleteTaxCommand = makeDeleteTaxRequest(id)

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
      ),
      taskEither.mapLeft(error => error.message)
    )
  }

  useEffect(() => {
    fetchTaxes({
      name: option.none,
      first: unsafePositiveInteger(1000)
    })()
  }, [fetchTaxes])

  return (
    <TaxesContext.Provider value={{ taxes, createTax, updateTax, deleteTax }}>
      {props.children}
    </TaxesContext.Provider>
  )
}
