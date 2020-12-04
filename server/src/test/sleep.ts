import { task, taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { Task } from 'fp-ts/Task'

export function sleep<A>(millis: number, a: A): Task<A> {
  return pipe(
    taskEither.tryCatch(
      () => new Promise(done => setTimeout(done, millis)),
      constVoid
    ),
    taskEither.fold(
      () => task.fromIO(() => a),
      () => task.fromIO(() => a)
    )
  )
}
