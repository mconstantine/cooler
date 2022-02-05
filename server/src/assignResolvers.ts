import userResolvers from './user/resolvers'
// import clientResolvers from './client/resolvers'
// import projectResolvers from './project/resolvers'
// import taskResolvers from './task/resolvers'
// import sessionResolvers from './session/resolvers'
// import taxResolvers from './tax/resolvers'
// import { merge } from './misc/merge'
import { HttpMethod, Resolver } from './misc/createResolver'
import express, { Express, Router } from 'express'

export type Resolvers = {
  path: string
} & Record<HttpMethod, Record<string, Resolver>>

export function assignResolvers(app: Express) {
  const resolvers = [userResolvers]

  resolvers.forEach(resolver => {
    const router = Router().use(express.json({ strict: true }))

    Object.entries(resolver.GET).forEach(([path, resolver]) => {
      router.get(path, resolver)
    })

    Object.entries(resolver.POST).forEach(([path, resolver]) => {
      router.post(path, resolver)
    })

    Object.entries(resolver.PUT).forEach(([path, resolver]) => {
      router.put(path, resolver)
    })

    Object.entries(resolver.DELETE).forEach(([path, resolver]) => {
      router.delete(path, resolver)
    })

    app.use(resolver.path, router)
  })
}
