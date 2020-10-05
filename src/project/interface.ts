import { ID, SQLDate } from '../misc/Types'

interface ProjectCommonData {
  readonly id: ID
  name: string
  description: string
  client: ID
  cashed_balance: number | null
}

export interface Project extends ProjectCommonData {
  cashed_at: Date | null
  readonly created_at: Date
  readonly updated_at: Date
}

export interface ProjectFromDatabase extends ProjectCommonData {
  cashed_at: SQLDate | null
  readonly created_at: SQLDate
  readonly updated_at: SQLDate
}

export type ProjectCreationInput = Pick<
  ProjectFromDatabase,
  'name' | 'description' | 'client'
>

export type ProjectUpdateInput = Partial<
  Omit<ProjectFromDatabase, 'id' | 'created_at' | 'updated_at'>
>
