import { option, taskEither } from 'fp-ts'
import { IO } from 'fp-ts/IO'
import { flow } from 'fp-ts/function'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { ClientForm } from '../../components/Form/Forms/ClientForm'
import { clientsRoute, useRouter } from '../../components/Router'
import { usePost } from '../../effects/api/useApi'
import { ClientCreationInput } from '../../entities/Client'
import { LocalizedString } from '../../globalDomain'
import { createClientRequest } from './domain'

export default function ClientCreation() {
  const { setRoute } = useRouter()
  const createClient = usePost(createClientRequest)

  const onSubmit: ReaderTaskEither<ClientCreationInput, LocalizedString, void> =
    flow(
      createClient,
      taskEither.chain(client =>
        taskEither.fromIO(() => setRoute(clientsRoute(client._id), false))
      )
    )

  const onCancel: IO<void> = () => setRoute(clientsRoute('all'), false)

  return (
    <ClientForm client={option.none} onSubmit={onSubmit} onCancel={onCancel} />
  )
}
