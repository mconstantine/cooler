import { TaskEither } from 'fp-ts/TaskEither'
import { startServer } from '../startServer'
import { either } from 'fp-ts'

export const setupTests = () =>
  new Promise<TaskEither<Error, void>>((resolve, reject) => {
    startServer()().then(
      either.fold(error => {
        reject(error)
      }, resolve)
    )
  })
