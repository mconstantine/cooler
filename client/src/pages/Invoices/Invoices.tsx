import { option } from 'fp-ts'
import { Reader } from 'fp-ts/Reader'
import { a18n, formatDate } from '../../a18n'
import { ConnectionList } from '../../components/ConnectionList/ConnectionList'
import { RoutedItem } from '../../components/List/List'
import { projectsRoute, useRouter } from '../../components/Router'
import { useConnection } from '../../effects/useConnection'
import { getInvoicesListRequest, InvoicesListItem } from './domain'

export default function Invoices() {
  const { setRoute } = useRouter()
  const { results, onSearchQueryChange, onLoadMore } = useConnection(
    getInvoicesListRequest,
    'DESC'
  )

  const renderInvoicesListItem: Reader<
    InvoicesListItem,
    RoutedItem
  > = invoice => {
    const invoiceNumber = invoice.invoiceNumber
    const invoiceDate = formatDate(invoice.invoiceDate)

    return {
      key: invoice._id,
      type: 'routed',
      label: option.some(invoice.clientName),
      content: invoice.name,
      description: option.some(a18n`${invoiceNumber} – ${invoiceDate}`),
      action: _ => setRoute(projectsRoute(invoice._id), _),
      details: true
    }
  }

  return (
    <ConnectionList
      title={a18n`Invoices`}
      emptyListMessage={a18n`No invoices found`}
      actions={option.none}
      query={results}
      renderListItem={renderInvoicesListItem}
      onLoadMore={option.some(onLoadMore)}
      onSearchQueryChange={option.some(onSearchQueryChange)}
      inputLabel={a18n`Search by invoice number`}
    />
  )
}
