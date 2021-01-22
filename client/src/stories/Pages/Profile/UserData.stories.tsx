import { Meta, Story } from '@storybook/react'
import { taskEither } from 'fp-ts'
import { useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { UserData } from '../../../components/Pages/Profile/UserData'
import { unsafeEmailString } from '../../../globalDomain'
import { CoolerStory } from '../../CoolerStory'

export const _UserData: Story = ({ onDeleteProfile, onLogout }) => {
  const [state, setState] = useState({
    name: unsafeLocalizedString('John Doe'),
    email: unsafeEmailString('john.doe@example.com'),
    created_at: new Date(2020, 11, 25),
    updated_at: new Date(2021, 0, 1)
  })

  return (
    <CoolerStory>
      <Content>
        <UserData
          user={state}
          onDataChange={data =>
            taskEither.fromIO(() =>
              setState({
                ...data,
                updated_at: new Date()
              })
            )
          }
          onDeleteProfile={taskEither.fromIO(onDeleteProfile)}
          onLogout={taskEither.fromIO(onLogout)}
        />
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Pages/Profile/User Data',
  argTypes: {
    onDeleteProfile: {
      action: 'profile deleted'
    },
    onLogout: {
      action: 'logout'
    }
  }
}

export default meta
