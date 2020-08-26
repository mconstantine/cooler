export interface Task {
  id: number
  name: string
  description?: string
  expectedWorkingHours: number
  project: number
  created_at: string
  updated_at: string
}
