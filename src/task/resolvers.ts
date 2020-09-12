import { GraphQLFieldResolver } from 'graphql'
import {
  Task,
  TaskCreationInput,
  TaskFromDatabase,
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
  getProjectTasks
} from './model'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { UserContext, UserFromDatabase } from '../user/interface'
import { ensureUser } from '../misc/ensureUser'
import { Connection } from '../misc/Connection'

type TaskProjectResolver = GraphQLFieldResolver<TaskFromDatabase, any>

const taskProjectResolver: TaskProjectResolver = async (
  task
): Promise<Project | null> => {
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

type CreateTaskMutation = GraphQLFieldResolver<
  any,
  UserContext,
  { task: TaskCreationInput }
>

const createTaskMutation: CreateTaskMutation = (
  _parent,
  { task },
  context
): Promise<Task | null> => {
  return createTask(task, ensureUser(context))
}

type UpdateTaskMutation = GraphQLFieldResolver<
  any,
  UserContext,
  { id: number; task: TaskUpdateInput }
>

const updateTaskMutation: UpdateTaskMutation = (
  _parent,
  { id, task },
  context
): Promise<Task | null> => {
  return updateTask(id, task, ensureUser(context))
}

type DeleteTaskMutation = GraphQLFieldResolver<any, UserContext, { id: number }>

const deleteTaskMutation: DeleteTaskMutation = (
  _parent,
  { id },
  context
): Promise<Task | null> => {
  return deleteTask(id, ensureUser(context))
}

type TaskQuery = GraphQLFieldResolver<any, UserContext, { id: number }>

const taskQuery: TaskQuery = (
  _parent,
  { id },
  context
): Promise<Task | null> => {
  return getTask(id, ensureUser(context))
}

type TasksQuery = GraphQLFieldResolver<
  any,
  UserContext,
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
    updateTask: UpdateTaskMutation
    deleteTask: DeleteTaskMutation
  }
  Query: {
    task: TaskQuery
    tasks: TasksQuery
  }
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
    updateTask: updateTaskMutation,
    deleteTask: deleteTaskMutation
  },
  Query: {
    task: taskQuery,
    tasks: tasksQuery
  }
}

export default resolvers
