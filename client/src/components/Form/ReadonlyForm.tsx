import { option } from 'fp-ts'
import { TaskEither } from 'fp-ts/TaskEither'
import { ComponentProps } from 'react'
import { LocalizedString } from '../../globalDomain'
import { Button } from '../Button/Button/Button'
import { Buttons } from '../Button/Buttons/Buttons'
import { LoadingButton } from '../Button/LoadingButton/LoadingButton'
import { List } from '../List/List'
import { Panel } from '../Panel/Panel'
import './ReadonlyForm.scss'

export interface ReadonlyItem<T extends string> {
  name: string
  label: LocalizedString
  value: T
}

interface Props<T extends string> {
  title: LocalizedString
  items: Array<ReadonlyItem<T>>
  buttons: Array<
    | ComponentProps<typeof Button>
    | ({
        type: 'loading'
        action: TaskEither<unknown, unknown>
      } & Omit<ComponentProps<typeof LoadingButton>, 'type'>)
  >
}

export function ReadonlyForm<T extends string>(props: Props<T>) {
  return (
    <Panel title={props.title} className="ReadonlyForm" framed>
      <List
        heading={option.none}
        items={props.items.map(item => ({
          type: 'readonly',
          key: item.name,
          label: option.some(item.label),
          content: (item.value as unknown) as LocalizedString,
          description: option.none
        }))}
      />

      <div className="actions">
        <Buttons spacing="spread">
          {props.buttons.map((props, index) => {
            switch (props.type) {
              case 'button':
              case 'iconButton':
                return <Button key={index} {...props} />
              case 'loading':
                return <LoadingButton key={index} {...props} type="button" />
            }
          })}
        </Buttons>
      </div>
    </Panel>
  )
}
