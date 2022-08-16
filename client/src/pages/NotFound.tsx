import { option } from 'fp-ts'
import { a18n } from '../a18n'
import { Card } from '../components/Card/Card'
import { homeRoute, useRouter } from '../components/Router'

export default function NotFound() {
  const { setRoute } = useRouter()

  return (
    <Card
      label={option.none}
      content={a18n`Page not found`}
      description={option.some(
        a18n`This page doesn't exist, where do you think you're going?`
      )}
      actions={[
        {
          type: 'sync',
          label: a18n`Go home`,
          action: _ => setRoute(homeRoute(), _)
        }
      ]}
    />
  )
}
