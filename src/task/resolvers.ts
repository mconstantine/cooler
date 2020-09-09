import { GraphQLFieldResolver } from 'graphql'
import { Task } from './interface'
import { getDatabase } from '../misc/getDatabase'
import { Project } from '../project/interface'
import SQL from 'sql-template-strings'
import { createTask, listTasks, updateTask, deleteTask, getTask } from './model'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { UserContext, User } from '../user/interface'
import { ensureUser } from '../misc/ensureUser'
import { queryToConnection } from '../misc/queryToConnection'
import { toSQLDate } from '../misc/dbUtils'

interface TaskResolvers {
  Task: {
    project: GraphQLFieldResolver<Task, any>
  }
  User: {
    tasks: GraphQLFieldResolver<User, ConnectionQueryArgs>
  }
  Project: {
    tasks: GraphQLFieldResolver<Project, ConnectionQueryArgs>
  },
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
  User: {
    tasks: (user, args) => {
      return queryToConnection(args, ['task.*'], 'task', SQL`
        JOIN project ON project.id = task.project
        JOIN client ON project.client = client.id
        WHERE client.user = ${user.id}
      `)
    }
  },
  Project: {
    tasks: (project, args) => {
      return queryToConnection(args, ['*'], 'task', SQL`WHERE project = ${project.id}`)
    }
  },
  Mutation: {
    createTask: (_parent, { task }, context) => {
      ensureUser(context)
      return createTask(task, context.user!)
    },
    updateTask: (_parent, { id, task }, context) => {
      ensureUser(context)
      return updateTask(id, {
        ...task,
        ...(task.start_time ? { start_time: toSQLDate(new Date(task.start_time)) } : {}),
      }, context.user!)
    },
    deleteTask: (_parent, { id }, context) => {
      ensureUser(context)
      return deleteTask(id, context.user!)
    }
  },
  Query: {
    task: async (_parent, { id }, context) => {
      ensureUser(context)
      return getTask(id, context.user!)
    },
    tasks: (_parent, args, context) => {
      ensureUser(context)
      return listTasks(args, context.user!)
    }
  }
} as TaskResolvers
