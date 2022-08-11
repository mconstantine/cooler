import { ResponsiveLineCanvas } from '@nivo/line'
import { pipe } from 'fp-ts/function'
import { a18n, formatMoneyAmount } from '../../a18n'
import { foldTheme, useTheme } from '../../contexts/ThemeContext'
import { CashPerMonth } from './domain'
import { Theme } from '@nivo/core'

export interface Props {
  data: CashPerMonth
}

export function CashPerMonthChart(props: Props) {
  const { theme } = useTheme()

  const formatDateShort = (date: Date) =>
    date.toLocaleDateString(a18n.getLocale(), {
      year: '2-digit',
      month: 'short'
    })

  const lineColor = pipe(
    theme,
    foldTheme(
      () => '#2196f3',
      () => '#90caf9'
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

  return (
    <div style={{ width: '100%', height: '50vh', marginTop: '48px' }}>
      <ResponsiveLineCanvas
        theme={chartTheme}
        margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
        data={[
          {
            id: 'cashPerMonth',
            data: props.data.map(({ monthDate, cash }) => ({
              x: monthDate,
              y: cash
            }))
          }
        ]}
        colors={lineColor}
        xFormat={value => formatDateShort(value as Date)}
        yFormat={value => formatMoneyAmount(value as number)}
        axisLeft={{
          legend: a18n`Money`,
          legendOffset: 8
        }}
        axisBottom={{
          legend: a18n`Time`,
          tickValues: props.data.map(_ => _.monthDate),
          format: formatDateShort,
          legendOffset: -8
        }}
      />
    </div>
  )
}
