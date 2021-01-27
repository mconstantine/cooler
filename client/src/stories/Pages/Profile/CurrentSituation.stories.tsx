import { Meta, Story } from '@storybook/react'
import { task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { CurrentSituation } from '../../../components/Pages/Profile/CurrentSituation'
import { Tax } from '../../../entities/Tax'
import {
  unsafeNonNegativeNumber,
  unsafePercentage
} from '../../../globalDomain'
import { CoolerStory } from '../../CoolerStory'

export const _CurrentSituation: Story = () => {
  const [since, setSince] = useState(new Date(2021, 0, 1))
  const to = new Date(2021, 0, 31)
  const pastDays = Math.round((to.getTime() - since.getTime()) / 86400000)
  const expectedWorkingHours = unsafeNonNegativeNumber(
    Math.max(pastDays * 8, 0)
  )
  const actualWorkingHours = unsafeNonNegativeNumber(
    Math.max(expectedWorkingHours - 8, 0)
  )
  const budget = unsafeNonNegativeNumber(expectedWorkingHours * 15)
  const balance = unsafeNonNegativeNumber(actualWorkingHours * 15)

  const taxes: Tax[] = [
    {
      label: unsafeLocalizedString('Some tax'),
      value: unsafePercentage(0.2572)
    },
    {
      label: unsafeLocalizedString('Some other tax'),
      value: unsafePercentage(0.1005)
    }
  ]

  return (
    <CoolerStory>
      <Content>
        <CurrentSituation
          since={since}
          onSinceDateChange={since =>
            pipe(
              task.fromIO(() => setSince(since)),
              task.delay(500),
              taskEither.rightTask
            )
          }
          data={{
            expectedWorkingHours,
            actualWorkingHours,
            budget,
            balance,
            taxes
          }}
        />
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Pages/Profile/Current Situation'
}

export default meta
