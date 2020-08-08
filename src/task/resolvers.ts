import { GraphQLFieldResolver } from 'graphql'
import { Task } from './Task'
import { getDatabase } from '../misc/getDatabase'
import { Project } from '../project/Project'
import SQL from 'sql-template-strings'
import { createTask, listTasks } from './model'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'

interface TaskResolvers {
  Task: {
    project: GraphQLFieldResolver<Task, any>
  }
  Mutation: {
    createTask: GraphQLFieldResolver<any, { task: Partial<Task> }>
  }
  Query: {
    task: GraphQLFieldResolver<any, { id: number }>
    tasks: GraphQLFieldResolver<any, ConnectionQueryArgs & { description?: string }>
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
  },
  Query: {
    task: async (_parent, { id }) => {
      const db = await getDatabase()
      return await db.get<Project>(SQL`SELECT * FROM task WHERE id = ${id}`)
    },
    tasks: (_parent, args) => {
      return listTasks(args)
    }
  }
} as TaskResolvers
