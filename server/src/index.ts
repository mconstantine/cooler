import a18n from 'a18n'
import { either } from 'fp-ts'
import { startServer } from './startServer'

startServer()().then(
  either.fold(
    error => console.log(error),
    () =>
      console.log(
        a18n`Server ready at http://localhost:${process.env.SERVER_PORT!}`
      )
  ),
  error => console.log(error)
)
