import { Meta, Story } from '@storybook/react'
import { Content } from '../../../components/Content/Content'
import { ProjectProgress as ProjectProgressComponent } from '../../../components/Pages/Project/ProjectProgress'
import { unsafeNonNegativeNumber } from '../../../globalDomain'
import { CoolerStory } from '../../CoolerStory'
import { fakeTaxes } from '../../utils'

interface Args {}

const progress = {
  expectedWorkingHours: unsafeNonNegativeNumber(160),
  actualWorkingHours: unsafeNonNegativeNumber(67.2),
  budget: unsafeNonNegativeNumber(2400),
  balance: unsafeNonNegativeNumber(1008)
}

const ProjectProgressTemplate: Story<Args> = () => {
  return (
    <CoolerStory>
      <Content>
        <ProjectProgressComponent data={progress} taxes={fakeTaxes} />
      </Content>
    </CoolerStory>
  )
}

export const ProjectProgress = ProjectProgressTemplate.bind({})

ProjectProgress.args = {}
ProjectProgress.argTypes = {}

const meta: Meta = {
  title: 'Cooler/Pages/Project/Project Progress'
}

export default meta
