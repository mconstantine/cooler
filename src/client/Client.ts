import { Connection } from '../misc/Connection'
import { Project } from '../project/Project'

export interface Client {
  id: number
  name: string
  created_at: string
  updated_at: string
  projects?: Connection<Project>
}
