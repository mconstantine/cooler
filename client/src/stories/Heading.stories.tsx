import { Meta, Story } from '@storybook/react'
import { unsafeLocalizedString } from '../a18n'
import { Body } from '../components/Body/Body'
import { Content } from '../components/Content/Content'
import {
  Heading as HeadingComponent,
  HeadingSize
} from '../components/Heading/Heading'
import { Color } from '../globalDomain'
import { colorControl } from './args'
import { CoolerStory } from './CoolerStory'

interface Args {
  size: HeadingSize
  color: Color
}

const HeadingTemplate: Story<Args> = props => {
  return (
    <CoolerStory>
      <Content>
        <HeadingComponent size={props.size} color={props.color}>
          {unsafeLocalizedString('Lorem ipsum dolor sit amet.')}
        </HeadingComponent>
        <Body color={props.color}>
          {unsafeLocalizedString(
            'Lorem ipsum dolor sit amet consectetur adipisicing elit. Alias exercitationem accusamus impedit at assumenda deserunt dignissimos itaque inventore vero ullam consequuntur, voluptatem ipsam nobis corrupti nisi cupiditate. Doloribus, amet earum?'
          )}
        </Body>
      </Content>
    </CoolerStory>
  )
}

export const Heading = HeadingTemplate.bind({})

Heading.args = {
  size: 40,
  color: 'default'
}

Heading.argTypes = {
  size: {
    name: 'Size',
    control: {
      type: 'select',
      options: {
        40: 40,
        36: 36,
        32: 32,
        27: 27,
        24: 24,
        21: 21
      } as Record<string, HeadingSize>
    }
  },
  color: {
    name: 'Color',
    control: colorControl
  }
}

const meta: Meta = {
  title: 'Cooler/Heading'
}

export default meta
