import { ResponsiveLineCanvas } from '@nivo/line'
import { pipe } from 'fp-ts/function'
import { a18n, formatMoneyAmount } from '../../a18n'
import { foldTheme, useTheme } from '../../contexts/ThemeContext'
import { CashPerMonth } from './domain'
import { Theme } from '@nivo/core'
import { useTaxes } from '../../contexts/TaxesContext'
import { query } from '../../effects/api/api'
import { LoadingBlock } from '../../components/Loading/LoadingBlock'
import { ErrorPanel } from '../../components/ErrorPanel/ErrorPanel'
import { calculateNetValue } from '../Profile/utils'

export interface Props {
  data: CashPerMonth
}

export function CashPerMonthChart(props: Props) {
  const { theme } = useTheme()
  const { taxes } = useTaxes()

  const formatDateShort = (date: Date) =>
    date.toLocaleDateString(a18n.getLocale(), {
      year: '2-digit',
      month: 'short'
    })

  const primaryColor = pipe(
    theme,
    foldTheme(
      () => '#2196f3',
      () => '#90caf9'
    )
  )

  const secondaryColor = pipe(
    theme,
    foldTheme(
      () => '#4caf50',
      () => '#81c784'
    )
  )

  const errorColor = pipe(
    theme,
    foldTheme(
      () => '#f44336',
      () => '#e57373'
    )
  )

  const chartTheme: Theme = pipe(
    theme,
    foldTheme<Theme>(
      () => ({
        background: 'transparent',
        textColor: '#000',
        tooltip: {
          container: {
            backgroundColor: '#fff'
          }
        },
        grid: {
          line: {
            stroke: 'rgba(49, 49, 49, 0.38)'
          }
        }
      }),
      () => ({
        background: 'transparent',
        textColor: '#fff',
        tooltip: {
          container: {
            backgroundColor: '#000'
          }
        },
        grid: {
          line: {
            stroke: 'rgba(206, 206, 206, 0.6)'
          }
        }
      })
    )
  )

  const years = props.data.map(entry => entry.monthDate.getFullYear())
  const minYear = Math.min(...years)
  const maxYear = Math.max(...years)

  const yearsRange = new Array(maxYear - minYear + 1)
    .fill(null)
    .map((_, index) => minYear + index)

  const monthsRange = new Array(12).fill(null).map((_, index) => index)

  const monthDates = yearsRange
    .flatMap(year => monthsRange.map(month => new Date(year, month)))
    .filter(monthDate => monthDate.getTime() <= Date.now())

  const data = pipe(
    taxes,
    query.map(taxes => {
      return monthDates.flatMap(monthDate => {
        const entry = props.data.find(
          entry =>
            entry.monthDate.getFullYear() === monthDate.getFullYear() &&
            entry.monthDate.getMonth() === monthDate.getMonth()
        )

        if (entry) {
          const netValue = calculateNetValue(entry.cash, taxes)
          return { monthDate, cash: entry.cash, netValue }
        } else {
          return { monthDate, cash: 0, netValue: 0 }
        }
      })
    })
  )

  return pipe(
    data,
    query.fold(
      () => <LoadingBlock />,
      error => <ErrorPanel error={error} />,
      data => (
        <div style={{ width: '100%', height: '50vh', marginTop: '48px' }}>
          <ResponsiveLineCanvas
            theme={chartTheme}
            margin={{ top: 20, right: 20, bottom: 70, left: 40 }}
            data={[
              {
                id: a18n`Gross`,
                data: data.map(({ monthDate, cash }) => ({
                  x: monthDate,
                  y: cash
                }))
              },
              {
                id: a18n`Net`,
                data: data.map(({ monthDate, netValue }) => ({
                  x: monthDate,
                  y: netValue
                }))
              },
              {
                id: a18n`Taxes`,
                data: data.map(({ monthDate, cash, netValue }) => ({
                  x: monthDate,
                  y: cash - netValue
                }))
              }
            ]}
            colors={[primaryColor, secondaryColor, errorColor]}
            xFormat={value => formatDateShort(value as Date)}
            yFormat={value => formatMoneyAmount(value as number)}
            axisLeft={{
              legend: a18n`Money`,
              legendOffset: 8
            }}
            axisBottom={{
              legend: a18n`Time`,
              tickValues: monthDates,
              format: formatDateShort,
              legendOffset: -8
            }}
            legends={[
              {
                anchor: 'bottom',
                direction: 'row',
                translateX: 0,
                translateY: 50,
                itemWidth: 60,
                itemHeight: 16
              }
            ]}
          />
        </div>
      )
    )
  )
}
