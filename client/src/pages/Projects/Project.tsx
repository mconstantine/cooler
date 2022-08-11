import { pipe } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { useEffect } from 'react'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { projectsRoute, useRouter } from '../../components/Router'
import { TaxesProvider } from '../../contexts/TaxesContext'
import { query } from '../../effects/api/api'
import { useReactiveCommand } from '../../effects/api/useApi'
import {
  Project as ProjectType,
  ProjectWithStats
} from '../../entities/Project'
import { ObjectId } from '../../globalDomain'
import { makeGetProjectQuery } from './domain'
import { ProjectData } from './ProjectData'
import { ProjectProgress } from './ProjectProgress'
import { ProjectSiblings } from './ProjectSiblings'
import { ProjectTasks } from './ProjectTasks'

interface Props {
  _id: ObjectId
}

export default function Project(props: Props) {
  const { setRoute } = useRouter()

  const [project, setProject, getProjectCommand] = useReactiveCommand(
    makeGetProjectQuery(props._id)
  )

  const onUpdate: Reader<ProjectWithStats, void> = setProject

  const onDelete: Reader<ProjectType, void> = () =>
    setRoute(projectsRoute('all'))

  useEffect(() => {
    const fetchProject = getProjectCommand()
    fetchProject()
  }, [getProjectCommand])

  return pipe(
    project,
    query.fold(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error} />,
      project => (
        <TaxesProvider>
          <ProjectData
            project={project}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
          <ProjectSiblings project={project} />
          <ProjectProgress project={project} />
          <ProjectTasks project={project} />
        </TaxesProvider>
      )
    )
  )
}
