import { GraphQLFieldResolver } from 'graphql'
import { Task } from './Task'
import { getDatabase } from '../misc/getDatabase'
import { Project } from '../project/Project'
import SQL from 'sql-template-strings'
import { createTask, listTasks, updateTask, deleteTask } from './model'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { UserContext } from '../user/User'
import { ensureUser } from '../misc/ensureUser'

interface TaskResolvers {
  Task: {
    project: GraphQLFieldResolver<Task, any>
  }
  Mutation: {
    createTask: GraphQLFieldResolver<any, UserContext, { task: Partial<Task> }>
    updateTask: GraphQLFieldResolver<any, UserContext, { id: number, task: Partial<Task> }>
    deleteTask: GraphQLFieldResolver<any, UserContext, { id: number }>
  }
  Query: {
    task: GraphQLFieldResolver<any, UserContext, { id: number }>
    tasks: GraphQLFieldResolver<any, UserContext, ConnectionQueryArgs & { name?: string }>
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
    createTask: (_parent, { task }, context) => {
      ensureUser(context)
      return createTask(task)
    },
    updateTask: (_parent, { id, task }, context) => {
      ensureUser(context)
      return updateTask(id, task)
    },
    deleteTask: (_parent, { id }, context) => {
      ensureUser(context)
      return deleteTask(id)
    }
  },
  Query: {
    task: async (_parent, { id }, context) => {
      ensureUser(context)
      const db = await getDatabase()
      return await db.get<Project>(SQL`SELECT * FROM task WHERE id = ${id}`)
    },
    tasks: (_parent, args, context) => {
      ensureUser(context)
      return listTasks(args)
    }
  }
} as TaskResolvers
