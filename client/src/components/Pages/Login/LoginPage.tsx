import { option, taskEither } from 'fp-ts'
import { flow } from 'fp-ts/function'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { useAccount } from '../../../contexts/AccountContext'
import { useMutation } from '../../../effects/useMutation'
import { LocalizedString } from '../../../globalDomain'
import { commonErrors } from '../../../misc/commonErrors'
import { getGraphQLError } from '../../../misc/getGraphQLError'
import { Content } from '../../Content/Content'
import { FormData, LoginForm } from '../../Form/Forms/LoginForm'
import {
  loginMutation,
  LoginMutationInput,
  LoginMutationOutput
} from './domain'

export default function LoginPage() {
  const { dispatch } = useAccount()

  const [login] = useMutation(
    loginMutation,
    option.none,
    LoginMutationInput,
    LoginMutationOutput
  )

  const onSubmit: ReaderTaskEither<FormData, LocalizedString, void> = flow(
    variables => login({ variables }),
    taskEither.mapLeft(getGraphQLError),
    taskEither.chain(taskEither.fromOption(() => commonErrors.decode)),
    taskEither.chain(response =>
      taskEither.fromIO(() =>
        dispatch({
          type: 'login',
          ...response.loginUser
        })
      )
    )
  )

  return (
    <Content>
      <LoginForm onSubmit={onSubmit} />
    </Content>
  )
}
