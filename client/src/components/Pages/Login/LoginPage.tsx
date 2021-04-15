import { taskEither } from 'fp-ts'
import { flow } from 'fp-ts/function'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { useAccount } from '../../../contexts/AccountContext'
import { useMutation } from '../../../effects/useMutation'
import { LocalizedString } from '../../../globalDomain'
import { Content } from '../../Content/Content'
import { FormData, LoginForm } from '../../Form/Forms/LoginForm'
import { loginMutation } from './domain'

export default function LoginPage() {
  const login = useMutation(loginMutation)
  const { dispatch } = useAccount()

  const onSubmit: ReaderTaskEither<FormData, LocalizedString, void> = flow(
    login,
    taskEither.bimap(
      error => error.message,
      ({ loginUser }) =>
        dispatch({
          type: 'login',
          ...loginUser
        })
    )
  )

  return (
    <Content>
      <LoginForm onSubmit={onSubmit} />
    </Content>
  )
}
