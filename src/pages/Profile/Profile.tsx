import { TaxesProvider } from '../../contexts/TaxesContext'
// import { CashedBalance } from './CashedBalance'
// import { LatestProjects } from './LatestProjects'
import { ProfileData } from './ProfileData'
// import { ProfileStats } from './ProfileStats'
// import { TasksDueToday } from './TasksDueToday'

export default function ProfilePage() {
  return (
    <TaxesProvider>
      <ProfileData />
      {/* <ProfileStats /> */}
      {/* <CashedBalance /> */}
      {/* <TasksDueToday /> */}
      {/* <LatestProjects /> */}
    </TaxesProvider>
  )
}
