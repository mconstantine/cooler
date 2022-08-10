import { IO } from 'fp-ts/IO'
import { TaskEither } from 'fp-ts/TaskEither'
import { Option } from 'fp-ts/Option'
import { useState } from 'react'
import { Color, LocalizedString } from '../../globalDomain'
import { Panel } from '../Panel/Panel'
import { List } from '../List/List'
import { option, taskEither } from 'fp-ts'
import { Buttons } from '../Button/Buttons/Buttons'
import { Button } from '../Button/Button/Button'
import { LoadingButton } from '../Button/LoadingButton/LoadingButton'
import './Card.scss'
import { constNull, constVoid, flow, pipe } from 'fp-ts/function'
import { Banner } from '../Banner/Banner'
import { skull } from 'ionicons/icons'
import { unsafeLocalizedString } from '../../a18n'

interface SyncAction {
  type: 'sync'
  label: LocalizedString
  action: IO<void>
  color?: Color
}

interface AsyncAction {
  type: 'async'
  label: Option<LocalizedString>
  action: TaskEither<LocalizedString, unknown>
  icon: string
  color?: Color
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

export function Card(props: Props) {
  const [error, setError] = useState<Option<LocalizedString>>(option.none)

  return (
    <Panel className="Card" actions={option.none}>
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
        emptyListMessage={unsafeLocalizedString('')}
      />
      {pipe(
        error,
        option.fold(constNull, error => (
          <Banner content={error} color="danger" icon={skull} />
        ))
      )}
      <Buttons>
        {props.actions.map((action, index) =>
          pipe(
            action,
            foldAction(
              action => (
                <Button
                  key={action.label}
                  type="button"
                  label={action.label}
                  action={action.action}
                  icon={option.none}
                  color={action.color}
                  flat
                />
              ),
              action => (
                <LoadingButton
                  key={pipe(
                    action.label,
                    option.getOrElse<string | number>(() => index)
                  )}
                  type="loadingButton"
                  label={action.label}
                  action={pipe(
                    taskEither.rightIO(() => setError(option.none)),
                    taskEither.chain(() => action.action),
                    taskEither.bimap(flow(option.some, setError), constVoid)
                  )}
                  icon={action.icon}
                  color={action.color}
                  flat
                />
              )
            )
          )
        )}
      </Buttons>
    </Panel>
  )
}
