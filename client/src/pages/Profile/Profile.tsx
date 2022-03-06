import { TaxesProvider } from '../../contexts/TaxesContext'
import { CashedBalance } from './CashedBalance'
import { ProfileData } from './ProfileData'
import { ProfileStats } from './ProfileStats'
import { TasksDueToday } from './TasksDueToday'

export default function ProfilePage() {
  return (
    <TaxesProvider>
      <ProfileData />
      <ProfileStats />
      <CashedBalance />
      <TasksDueToday />
    </TaxesProvider>
  )
}
