import { GraphQLFieldResolver } from 'graphql'
import {
  Task,
  TaskCreationInput,
  TaskFromDatabase,
  TasksBatchCreationInput,
  TaskUpdateInput
} from './interface'
import { Project, ProjectFromDatabase } from '../project/interface'
import {
  createTask,
  listTasks,
  updateTask,
  deleteTask,
  getTask,
  getTaskProject,
  getUserTasks,
  getProjectTasks,
  createTasksBatch
} from './model'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { Context, UserContext, UserFromDatabase } from '../user/interface'
import { ensureUser } from '../misc/ensureUser'
import { Connection } from '../misc/Connection'
import {
  publish,
  Subscription,
  SubscriptionImplementation,
  WithFilter
} from '../misc/pubsub'
import { withFilter } from 'apollo-server-express'
import { pubsub } from '../pubsub'
import { definitely } from '../misc/definitely'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'

const TASK_CREATED = 'TASK_CREATED'

type TaskProjectResolver = GraphQLFieldResolver<TaskFromDatabase, any>

const taskProjectResolver: TaskProjectResolver = async (
  task
): Promise<Project> => {
  return getTaskProject(task)
}

type UserTasksResolver = GraphQLFieldResolver<
  UserFromDatabase,
  ConnectionQueryArgs
>

const userTasksResolver: UserTasksResolver = (
  user,
  args
): Promise<Connection<Task>> => {
  return getUserTasks(user, args)
}

type ProjectTasksResolver = GraphQLFieldResolver<
  ProjectFromDatabase,
  ConnectionQueryArgs
>

const projectTasksResolver: ProjectTasksResolver = (
  project,
  args
): Promise<Connection<Task>> => {
  return getProjectTasks(project, args)
}

interface TaskSubscription extends Subscription<Task> {
  createdTask: SubscriptionImplementation<Task>
}

const taskSubscription: TaskSubscription = {
  createdTask: {
    subscribe: withFilter(() => pubsub.asyncIterator([TASK_CREATED]), (async (
      { createdTask },
      { project },
      context
    ) => {
      const db = await getDatabase()
      const { user } = definitely(
        await db.get(SQL`
          SELECT client.user
          FROM task
          JOIN project ON task.project = project.id
          JOIN client ON project.client = client.id
          WHERE task.id = ${createdTask.id}
        `)
      )

      if (user !== context.user.id) {
        return false
      }

      return !project || project === createdTask.project
    }) as WithFilter<{ project: number | null }, TaskSubscription, UserContext, Task>)
  }
}

type CreateTaskMutation = GraphQLFieldResolver<
  any,
  Context,
  { task: TaskCreationInput }
>

const createTaskMutation: CreateTaskMutation = async (
  _parent,
  { task },
  context
): Promise<Task | null> => {
  const res = await createTask(task, ensureUser(context))

  res &&
    publish<Task, TaskSubscription>(TASK_CREATED, {
      createdTask: res
    })

  return res
}

type CreateTasksBatchMutation = GraphQLFieldResolver<
  any,
  Context,
  { input: TasksBatchCreationInput }
>

const createTasksBatchMutation: CreateTasksBatchMutation = (
  _parent,
  { input },
  context
): Promise<Project | null> => {
  return createTasksBatch(input, ensureUser(context))
}

type UpdateTaskMutation = GraphQLFieldResolver<
  any,
  Context,
  { id: number; task: TaskUpdateInput }
>

const updateTaskMutation: UpdateTaskMutation = (
  _parent,
  { id, task },
  context
): Promise<Task | null> => {
  return updateTask(id, task, ensureUser(context))
}

type DeleteTaskMutation = GraphQLFieldResolver<any, Context, { id: number }>

const deleteTaskMutation: DeleteTaskMutation = (
  _parent,
  { id },
  context
): Promise<Task | null> => {
  return deleteTask(id, ensureUser(context))
}

type TaskQuery = GraphQLFieldResolver<any, Context, { id: number }>

const taskQuery: TaskQuery = (
  _parent,
  { id },
  context
): Promise<Task | null> => {
  return getTask(id, ensureUser(context))
}

type TasksQuery = GraphQLFieldResolver<
  any,
  Context,
  ConnectionQueryArgs & { name?: string }
>

const tasksQuery: TasksQuery = (
  _parent,
  args,
  context
): Promise<Connection<Task>> => {
  return listTasks(args, ensureUser(context))
}

interface TaskResolvers {
  Task: {
    project: TaskProjectResolver
  }
  User: {
    tasks: UserTasksResolver
  }
  Project: {
    tasks: ProjectTasksResolver
  }
  Mutation: {
    createTask: CreateTaskMutation
    createTasksBatch: CreateTasksBatchMutation
    updateTask: UpdateTaskMutation
    deleteTask: DeleteTaskMutation
  }
  Query: {
    task: TaskQuery
    tasks: TasksQuery
  }
  Subscription: TaskSubscription
}

const resolvers: TaskResolvers = {
  Task: {
    project: taskProjectResolver
  },
  User: {
    tasks: userTasksResolver
  },
  Project: {
    tasks: projectTasksResolver
  },
  Mutation: {
    createTask: createTaskMutation,
    createTasksBatch: createTasksBatchMutation,
    updateTask: updateTaskMutation,
    deleteTask: deleteTaskMutation
  },
  Query: {
    task: taskQuery,
    tasks: tasksQuery
  },
  Subscription: taskSubscription
}

export default resolvers
