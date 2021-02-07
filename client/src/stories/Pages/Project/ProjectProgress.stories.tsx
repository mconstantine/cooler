import { Meta, Story } from '@storybook/react'
import { boolean } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Content } from '../../../components/Content/Content'
import { ProjectProgress as ProjectProgressComponent } from '../../../components/Pages/Project/ProjectProgress'
import { unsafeNonNegativeNumber } from '../../../globalDomain'
import { CoolerStory } from '../../CoolerStory'
import { fakeTaxes } from '../../utils'

interface Args {
  isCashed: boolean
}

const ProjectProgressTemplate: Story<Args> = props => {
  const progress = {
    expectedWorkingHours: unsafeNonNegativeNumber(160),
    actualWorkingHours: pipe(
      props.isCashed,
      boolean.fold(
        () => unsafeNonNegativeNumber(67.2),
        () => unsafeNonNegativeNumber(160.5)
      )
    ),
    budget: unsafeNonNegativeNumber(2400),
    balance: pipe(
      props.isCashed,
      boolean.fold(
        () => unsafeNonNegativeNumber(1008),
        () => unsafeNonNegativeNumber(2407.5)
      )
    )
  }

  return (
    <CoolerStory>
      <Content>
        <ProjectProgressComponent
          data={progress}
          taxes={fakeTaxes}
          isProjectCashed={props.isCashed}
        />
      </Content>
    </CoolerStory>
  )
}

export const ProjectProgress = ProjectProgressTemplate.bind({})

ProjectProgress.args = {
  isCashed: false
}

ProjectProgress.argTypes = {
  isCashed: {
    name: 'Is cashed',
    description: 'Simulate whether the represented project is cashed'
  }
}

const meta: Meta = {
  title: 'Cooler/Pages/Project/Project Progress'
}

export default meta
