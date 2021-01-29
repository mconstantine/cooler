import { boolean, option, taskEither } from 'fp-ts'
import { flow, pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { NonEmptyString } from 'io-ts-types'
import { FC, useState } from 'react'
import { a18n, formatDateTime } from '../../../a18n'
import { EmailString, LocalizedString } from '../../../globalDomain'
import { Option } from 'fp-ts/Option'
import { Panel } from '../../Panel/Panel'
import { List } from '../../List/List'
import { Buttons } from '../../Button/Buttons/Buttons'
import { Button } from '../../Button/Button/Button'
import { LoadingButton } from '../../Button/LoadingButton/LoadingButton'
import { skull } from 'ionicons/icons'
import { UserForm } from '../../Form/Forms/UserForm'

interface UserData {
  name: LocalizedString
  email: EmailString
  created_at: Date
  updated_at: Date
}

interface UserUpdate extends UserData {
  newPassword: Option<NonEmptyString>
}

interface Props {
  user: UserData
  onDataChange: (data: UserUpdate) => TaskEither<LocalizedString, unknown>
  onLogout: () => void
  onDeleteProfile: TaskEither<LocalizedString, unknown>
}

export const UserData: FC<Props> = props => {
  const [isEditing, setIsEditing] = useState(false)

  const onSubmit = flow(
    props.onDataChange,
    taskEither.chain(() => taskEither.fromIO(() => setIsEditing(false)))
  )

  const onCancel = () => setIsEditing(false)

  return pipe(
    isEditing,
    boolean.fold(
      () => (
        <Panel title={a18n`Your data`} framed>
          <List
            heading={option.none}
            items={[
              {
                type: 'readonly',
                key: 'name',
                label: option.some(a18n`Name`),
                content: props.user.name,
                description: option.none
              },
              {
                type: 'readonly',
                key: 'email',
                label: option.some(a18n`E-mail address`),
                content: (props.user.email as unknown) as LocalizedString,
                description: option.none
              },
              {
                type: 'readonly',
                key: 'created_at',
                label: option.some(a18n`Created at`),
                content: formatDateTime(props.user.created_at),
                description: option.none
              },
              {
                type: 'readonly',
                key: 'updated_at',
                label: option.some(a18n`Last updated at`),
                content: formatDateTime(props.user.updated_at),
                description: option.none
              }
            ]}
          />
          <Buttons spacing="spread">
            <Button
              type="button"
              color="primary"
              label={a18n`Edit`}
              action={() => setIsEditing(true)}
              icon={option.none}
            />
            <Button
              type="button"
              label={a18n`Logout`}
              action={props.onLogout}
              icon={option.none}
              flat
            />
            <LoadingButton
              type="button"
              label={a18n`Delete profile`}
              color="danger"
              flat
              action={props.onDeleteProfile}
              icon={skull}
            />
          </Buttons>
        </Panel>
      ),
      () => (
        <UserForm user={props.user} onSubmit={onSubmit} onCancel={onCancel} />
      )
    )
  )
}
