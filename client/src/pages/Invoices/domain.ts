import * as t from 'io-ts'
import { DateFromISOString } from 'io-ts-types'
import { makeGetRequest } from '../../effects/api/useApi'
import { LocalizedString, ObjectId } from '../../globalDomain'
import { Connection, ConnectionQueryInput } from '../../misc/Connection'

const InvoicesListItem = t.type(
  {
    _id: ObjectId,
    name: LocalizedString,
    invoiceNumber: LocalizedString,
    invoiceDate: DateFromISOString,
    clientName: LocalizedString
  },
  'InvoicesListItem'
)
export type InvoicesListItem = t.TypeOf<typeof InvoicesListItem>

export const getInvoicesListRequest = makeGetRequest({
  url: '/projects/invoices',
  inputCodec: ConnectionQueryInput,
  outputCodec: Connection(InvoicesListItem)
})
