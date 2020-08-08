import faker from 'faker'
import { Project } from '../project/Project'

export function getFakeProject(data?: Partial<Project>): Partial<Project> {
  return {
    name: faker.lorem.sentence(),
    client: null,
    ...data
  }
}
