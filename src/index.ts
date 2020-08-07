import { ApolloServer } from 'apollo-server'
import { typeDefs } from './typeDefs'
import { resolvers } from './resolvers'
import initClient from './client/init'
import initProject from './project/init'
import initTask from './task/init'

(async () => {
  await initClient()
  await initProject()
  await initTask()

  const server = new ApolloServer({
    typeDefs,
    resolvers
  })

  server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`)
  })
})()
