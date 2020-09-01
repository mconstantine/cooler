export interface Task {
  id: number
  name: string
  description?: string
  expectedWorkingHours: number
  hourlyCost: number
  project: number
  start_time: string
  created_at: string
  updated_at: string
}
