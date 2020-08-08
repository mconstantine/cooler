import { GraphQLFieldResolver } from 'graphql'
import { Task } from './Task'
import { getDatabase } from '../misc/getDatabase'
import { Project } from '../project/Project'
import SQL from 'sql-template-strings'
import { createTask } from './model'

interface TaskResolvers {
  Task: {
    project: GraphQLFieldResolver<Task, any>
  }
  Mutation: {
    createTask: GraphQLFieldResolver<any, { task: Partial<Task> }>
  }
}

export default {
  Task: {
    project: async task => {
      const db = await getDatabase()
      return await db.get<Project>(SQL`SELECT * FROM project WHERE id = ${task.project}`)
    }
  },
  Mutation: {
    createTask: (_parent, { task }) => {
      return createTask(task)
    }
  }
} as TaskResolvers
