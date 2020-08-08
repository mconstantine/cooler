export interface Task {
  id: number
  description: string
  expectedWorkingHours: number
  actualWorkingHours: number
  project: number
  created_at: string
  updated_at: string
}
