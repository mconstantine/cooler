import { ReaderTaskEither } from 'fp-ts/ReaderTaskEither'
import { Option } from 'fp-ts/Option'
import { FC, useState } from 'react'
import { CashData, Project } from '../../../entities/Project'
import { LocalizedString } from '../../../globalDomain'
import { flow, pipe } from 'fp-ts/function'
import { boolean, option, taskEither } from 'fp-ts'
import { ProjectCashDataForm } from '../../Form/Forms/ProjectCashDataForm'
import { Panel } from '../../Panel/Panel'
import { a18n, formatDate, formatMoneyAmount } from '../../../a18n'
import { List, ValuedItem } from '../../List/List'
import { Tax } from '../../../entities/Tax'
import { getNetValue } from '../utils'
import { Buttons } from '../../Button/Buttons/Buttons'
import { Button } from '../../Button/Button/Button'
import { LoadingButton } from '../../Button/LoadingButton/LoadingButton'
import { arrowUndo } from 'ionicons/icons'

interface Props {
  data: Option<CashData>
  budget: Project['budget']
  balance: Project['balance']
  taxes: Tax[]
  onChange: ReaderTaskEither<Option<CashData>, LocalizedString, unknown>
}

export const ProjectCashData: FC<Props> = props => {
  const [isEditing, setIsEditing] = useState(false)

  const renderTaxItem = (
    commonKey: string,
    initialValue: number,
    tax: Tax
  ): ValuedItem => {
    const taxedFraction = -(initialValue * tax.value)

    return {
      key: `${commonKey}${tax.label}`,
      type: 'valued',
      label: option.none,
      content: tax.label,
      description: option.none,
      value: formatMoneyAmount(taxedFraction),
      progress: option.none,
      valueColor: 'danger',
      size: 'small'
    }
  }

  return pipe(
    isEditing,
    boolean.fold(
      () =>
        pipe(
          props.data,
          option.fold(
            () => (
              <Panel
                title={a18n`Cashed`}
                action={option.some({
                  type: 'sync',
                  label: a18n`Set as cashed`,
                  action: () => setIsEditing(true),
                  icon: option.none
                })}
                framed
              />
            ),
            data => (
              <Panel title={a18n`Cashed`} action={option.none} framed>
                <List
                  heading={option.none}
                  items={[
                    {
                      key: 'at',
                      type: 'readonly',
                      label: option.some(a18n`Cashed at`),
                      content: formatDate(data.at),
                      description: option.none
                    },
                    {
                      key: 'balance',
                      type: 'valued',
                      label: option.none,
                      content: a18n`Cashed balance`,
                      description: option.none,
                      value: formatMoneyAmount(data.balance),
                      progress: option.none
                    },
                    ...props.taxes.map(tax =>
                      renderTaxItem('balance', data.balance, tax)
                    ),
                    {
                      key: 'netIncome',
                      type: 'valued',
                      label: option.none,
                      content: a18n`Net income`,
                      description: option.none,
                      value: formatMoneyAmount(
                        getNetValue(data.balance, props.taxes)
                      ),
                      progress: option.none
                    }
                  ]}
                />
                <Buttons spacing="spread">
                  <Button
                    type="button"
                    label={a18n`Edit`}
                    action={() => setIsEditing(true)}
                    icon={option.none}
                    color="primary"
                  />
                  <LoadingButton
                    type="button"
                    label={a18n`Set as not cashed`}
                    action={props.onChange(option.none)}
                    icon={arrowUndo}
                    flat
                  />
                </Buttons>
              </Panel>
            )
          )
        ),
      () => (
        <ProjectCashDataForm
          data={props.data}
          budget={props.budget}
          balance={props.balance}
          onSubmit={flow(
            option.some,
            flow(
              props.onChange,
              taskEither.chain(() =>
                taskEither.fromIO(() => setIsEditing(false))
              )
            )
          )}
          onCancel={() => setIsEditing(false)}
        />
      )
    )
  )
}
