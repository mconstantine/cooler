import { pipe } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { useEffect } from 'react'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { projectsRoute, useRouter } from '../../components/Router'
import { query } from '../../effects/api/api'
import { useReactiveCommand } from '../../effects/api/useApi'
import { Project as ProjectType } from '../../entities/Project'
import { PositiveInteger } from '../../globalDomain'
import { makeProjectQuery } from './domain'
import { ProjectData } from './ProjectData'

interface Props {
  id: PositiveInteger
}

export default function Project(props: Props) {
  const { setRoute } = useRouter()

  const [project, setProject, getProjectCommand] = useReactiveCommand(
    makeProjectQuery(props.id)
  )

  const onUpdate: Reader<ProjectType, void> = setProject

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
      error => <ErrorPanel error={error.message} />,
      project => (
        <>
          <ProjectData
            project={project}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        </>
      )
    )
  )
}
