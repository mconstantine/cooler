import { Meta, Story } from '@storybook/react'
import { boolean, task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { ProjectCashData as ProjectCashDataComponent } from '../../../components/Pages/Project/ProjectCashData'
import { CashData } from '../../../entities/Project'
import { CoolerStory } from '../../CoolerStory'
import { fakeProject, fakeTaxes } from '../../utils'

interface Args {
  shouldFail: boolean
}

const ProjectCashDataTemplate: Story<Args> = props => {
  const [data, setData] = useState<Option<CashData>>(fakeProject.cashed)

  const onChange = (data: Option<CashData>) =>
    pipe(
      props.shouldFail,
      boolean.fold(
        () =>
          pipe(
            task.fromIO(() => setData(data)),
            task.delay(500),
            taskEither.rightTask
          ),
        () => taskEither.left(unsafeLocalizedString("I'm an error!"))
      )
    )

  return (
    <CoolerStory>
      <Content>
        <ProjectCashDataComponent
          data={data}
          budget={fakeProject.budget}
          balance={fakeProject.balance}
          taxes={fakeTaxes}
          onChange={onChange}
        />
      </Content>
    </CoolerStory>
  )
}

export const ProjectCashData = ProjectCashDataTemplate.bind({})

ProjectCashData.args = {
  shouldFail: false
}

ProjectCashData.argTypes = {
  shouldFail: {
    name: 'Should fail',
    description: 'Set this to true to make changes fail',
    control: 'boolean'
  }
}

const meta: Meta = {
  title: 'Cooler/Pages/Project/Project Cash Data'
}

export default meta
