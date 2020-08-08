import { Connection } from '../misc/Connection'
import { Project } from '../project/Project'

export interface Client {
  id: number
  name: string
  user: number
  created_at: string
  updated_at: string
  projects?: Connection<Project>
}
