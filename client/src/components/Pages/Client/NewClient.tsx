import { option, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { useMutation } from '../../../effects/useMutation'
import { ClientCreationInput } from '../../../entities/Client'
import { LocalizedString } from '../../../globalDomain'
import { ClientForm } from '../../Form/Forms/ClientForm'
import { clientsRoute, useRouter } from '../../Router'
import { createClientMutation } from './domain'

export default function NewClient() {
  const createClient = useMutation(createClientMutation)
  const { setRoute } = useRouter()
  const onCancel = () => setRoute(clientsRoute('all'))

  const onSubmit: ReaderTaskEither<
    ClientCreationInput,
    LocalizedString,
    void
  > = client =>
    pipe(
      createClient({ client }),
      taskEither.mapLeft(error => error.message),
      taskEither.chain(({ createClient }) =>
        taskEither.fromIO(() => setRoute(clientsRoute(createClient.id)))
      )
    )

  return (
    <ClientForm client={option.none} onSubmit={onSubmit} onCancel={onCancel} />
  )
}
