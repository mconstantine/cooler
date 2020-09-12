import { ID, SQLDate } from '../misc/Types'

interface ProjectCommonData {
  readonly id: ID
  name: string
  description: string
  client: ID
  cashed_at: SQLDate | null
  cashed_balance: number | null
}

export interface Project extends ProjectCommonData {
  readonly created_at: Date
  readonly updated_at: Date
}

export interface ProjectFromDatabase extends ProjectCommonData {
  readonly created_at: SQLDate
  readonly updated_at: SQLDate
}

export type ProjectCreationInput = Pick<
  Project,
  'name' | 'description' | 'client'
>

export type ProjectUpdateInput = Partial<
  Omit<Project, 'id' | 'created_at' | 'updated_at'>
>
