import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import {
  a18n,
  formatDateTime,
  formatMoneyAmount,
  formatNumber,
  unsafeLocalizedString
} from '../../a18n'
import { ReadOnlyInput } from '../../components/Form/Input/ReadOnlyInput/ReadOnlyInput'
import { Panel } from '../../components/Panel/Panel'
import { TaskWithStats } from '../../entities/Task'

interface Props {
  task: TaskWithStats
}

export default function TaskData(props: Props) {
  return (
    <Panel title={props.task.name} framed action={option.none}>
      <ReadOnlyInput name="name" label={a18n`Name`} value={props.task.name} />
      <ReadOnlyInput
        name="description"
        label={a18n`Description`}
        value={pipe(
          props.task.description,
          option.getOrElse(() => unsafeLocalizedString(''))
        )}
      />
      <ReadOnlyInput
        name="project"
        label={a18n`Project`}
        value={props.task.project.name}
      />
      <ReadOnlyInput
        name="startTime"
        label={a18n`Start time`}
        value={formatDateTime(props.task.startTime)}
      />
      <ReadOnlyInput
        name="expectedWorkingHours"
        label={a18n`Expected working hours`}
        value={formatNumber(props.task.expectedWorkingHours)}
      />
      <ReadOnlyInput
        name="hourlyCost"
        label={a18n`Hourly cost`}
        value={formatMoneyAmount(props.task.hourlyCost)}
      />
      <ReadOnlyInput
        name="createdAt"
        label={a18n`Created at`}
        value={formatDateTime(props.task.createdAt)}
      />
      <ReadOnlyInput
        name="updatedAt"
        label={a18n`Last updated at`}
        value={formatDateTime(props.task.updatedAt)}
      />
    </Panel>
  )
}
