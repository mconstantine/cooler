import { Meta, Story } from '@storybook/react'
import { boolean, option, taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { NonEmptyString } from 'io-ts-types'
import { heart } from 'ionicons/icons'
import { unsafeLocalizedString } from '../a18n'
import { Card as CardComponent } from '../components/Card/Card'
import { Content } from '../components/Content/Content'
import { LocalizedString } from '../globalDomain'
import { CoolerStory } from './CoolerStory'

interface Args {
  label: LocalizedString
  content: LocalizedString
  description: LocalizedString
  unwrapDescription: boolean
  shouldFail: boolean
}

const CardTemplate: Story<Args> = props => {
  return (
    <CoolerStory>
      <Content>
        <CardComponent
          label={pipe(
            props.label,
            NonEmptyString.decode,
            option.fromEither,
            option.map(unsafeLocalizedString)
          )}
          content={props.content}
          description={pipe(
            props.description,
            NonEmptyString.decode,
            option.fromEither,
            option.map(unsafeLocalizedString)
          )}
          unwrapDescription={props.unwrapDescription}
          actions={[
            {
              type: 'sync',
              label: unsafeLocalizedString('Sync action'),
              action: constVoid
            },
            {
              type: 'async',
              label: unsafeLocalizedString('Async action'),
              action: pipe(
                props.shouldFail,
                boolean.fold(
                  () => taskEither.rightIO(constVoid),
                  () => taskEither.left(unsafeLocalizedString("I'm an error!"))
                )
              ),
              icon: heart
            }
          ]}
        />
      </Content>
    </CoolerStory>
  )
}

export const Card = CardTemplate.bind({})

Card.args = {
  label: unsafeLocalizedString('A architecto eum esse repudiandae'),
  content: unsafeLocalizedString('Lorem ipsum dolor sit amet.'),
  description: unsafeLocalizedString(
    'Facilis nulla ex recusandae accusantium porro eaque rerum totam quos corrupti! Fugit ipsam facilis blanditiis officiis ducimus accusamus tempora inventore cumque molestias.'
  ),
  unwrapDescription: false,
  shouldFail: false
}

Card.argTypes = {
  label: {
    name: 'Label',
    control: 'text'
  },
  content: {
    name: 'Content',
    control: 'text'
  },
  description: {
    name: 'Description',
    control: 'text'
  },
  unwrapDescription: {
    name: 'Unwrap description',
    control: 'boolean'
  },
  shouldFail: {
    name: 'Should fail',
    description: 'Set this to true to make the async action fail',
    control: 'boolean'
  }
}

const meta: Meta = {
  title: 'Cooler/Card'
}

export default meta
