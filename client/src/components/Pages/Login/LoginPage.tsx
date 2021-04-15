import { readerTaskEither } from 'fp-ts'
import { constVoid } from 'fp-ts/function'
import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { LocalizedString } from '../../../globalDomain'
import { Content } from '../../Content/Content'
import { FormData, LoginForm } from '../../Form/Forms/LoginForm'

export default function LoginPage() {
  const onSubmit: ReaderTaskEither<
    FormData,
    LocalizedString,
    void
  > = readerTaskEither.fromIO(constVoid)

  return (
    <Content>
      <LoginForm onSubmit={onSubmit} />
    </Content>
  )
}
