export interface Project {
  id: number
  name: string
  description: string
  client: number
  cached_at?: string | null
  created_at: string
  updated_at: string
}
