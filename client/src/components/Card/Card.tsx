import { IO } from 'fp-ts/IO'
import { TaskEither } from 'fp-ts/TaskEither'
import { Option } from 'fp-ts/Option'
import { FC, useState } from 'react'
import { LocalizedString } from '../../globalDomain'
import { Panel } from '../Panel/Panel'
import { List } from '../List/List'
import { option, taskEither } from 'fp-ts'
import { Buttons } from '../Button/Buttons/Buttons'
import { Button } from '../Button/Button/Button'
import { LoadingButton } from '../Button/LoadingButton/LoadingButton'
import './Card.scss'
import { constNull, constVoid, flow, pipe } from 'fp-ts/lib/function'
import { Label } from '../Label/Label'
import { skull } from 'ionicons/icons'

interface SyncAction {
  type: 'sync'
  label: LocalizedString
  action: IO<void>
}

interface AsyncAction {
  type: 'async'
  label: LocalizedString
  action: TaskEither<LocalizedString, unknown>
  icon: string
}

type Action = SyncAction | AsyncAction

function foldAction<T>(
  whenSync: (action: SyncAction) => T,
  whenAsync: (action: AsyncAction) => T
): (action: Action) => T {
  return action => {
    switch (action.type) {
      case 'sync':
        return whenSync(action)
      case 'async':
        return whenAsync(action)
    }
  }
}

interface Props {
  label: Option<LocalizedString>
  content: LocalizedString
  description: Option<LocalizedString>
  unwrapDescription?: boolean
  actions: Action[]
}

export const Card: FC<Props> = props => {
  const [error, setError] = useState<Option<LocalizedString>>(option.none)

  return (
    <Panel className="Card">
      <List
        heading={option.none}
        unwrapDescriptions={props.unwrapDescription}
        items={[
          {
            key: 0,
            type: 'readonly',
            label: props.label,
            content: props.content,
            description: props.description
          }
        ]}
      />
      {pipe(
        error,
        option.fold(constNull, error => (
          <Label content={error} color="danger" icon={skull} />
        ))
      )}
      <Buttons>
        {props.actions.map(
          foldAction(
            action => (
              <Button
                key={action.label}
                type="button"
                label={action.label}
                action={action.action}
                icon={option.none}
                flat
              />
            ),
            action => (
              <LoadingButton
                key={action.label}
                type="button"
                label={action.label}
                action={pipe(
                  taskEither.rightIO(() => setError(option.none)),
                  taskEither.chain(() => action.action),
                  taskEither.bimap(flow(option.some, setError), constVoid)
                )}
                icon={action.icon}
                flat
              />
            )
          )
        )}
      </Buttons>
    </Panel>
  )
}
