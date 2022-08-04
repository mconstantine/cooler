import { TaxesProvider } from '../../contexts/TaxesContext'
import { TaxesList } from './TaxesList'

export default function Settings() {
  return (
    <TaxesProvider>
      <TaxesList />
    </TaxesProvider>
  )
}
