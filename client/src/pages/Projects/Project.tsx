import { PositiveInteger } from '../../globalDomain'
import { ProjectData } from './ProjectData'
import { ProjectProgress } from './ProjectProgress'

interface Props {
  id: PositiveInteger
}

export default function Project(props: Props) {
  return (
    <>
      <ProjectData id={props.id} />
    </>
  )
}
