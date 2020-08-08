import { GraphQLFieldResolver } from 'graphql'
import { Task } from './Task'
import { getDatabase } from '../misc/getDatabase'
import { Project } from '../project/Project'
import SQL from 'sql-template-strings'
import { createTask, listTasks, updateTask, deleteTask } from './model'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'

interface TaskResolvers {
  Task: {
    project: GraphQLFieldResolver<Task, any>
  }
  Mutation: {
    createTask: GraphQLFieldResolver<any, { task: Partial<Task> }>
    updateTask: GraphQLFieldResolver<any, { id: number, task: Partial<Task> }>
    deleteTask: GraphQLFieldResolver<any, { id: number }>
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
    },
    updateTask: (_parent, { id, task }) => {
      return updateTask(id, task)
    },
    deleteTask: (_parent, { id }) => {
      return deleteTask(id)
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
