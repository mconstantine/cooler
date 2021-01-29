import { Meta, Story } from '@storybook/react'
import { unsafeLocalizedString } from '../a18n'
import { Body as BodyComponent } from '../components/Body/Body'
import { Content } from '../components/Content/Content'
import { Color } from '../globalDomain'
import { colorControl } from './args'
import { CoolerStory } from './CoolerStory'

interface Args {
  color: Color
}

const BodyTemplate: Story<Args> = props => {
  return (
    <CoolerStory>
      <Content>
        <BodyComponent color={props.color}>
          {unsafeLocalizedString(
            'Lorem ipsum dolor sit amet consectetur, adipisicing elit. Odio voluptatem dicta pariatur nobis recusandae maiores fugiat eveniet suscipit, fugit reiciendis, earum saepe. Reprehenderit laboriosam debitis vero eos doloribus qui aspernatur tenetur vitae pariatur perspiciatis omnis, incidunt quae consectetur sapiente rerum! Aut voluptatibus cumque impedit, rem vel adipisci laboriosam quos voluptate?'
          )}
        </BodyComponent>
      </Content>
    </CoolerStory>
  )
}

export const Body = BodyTemplate.bind({})

Body.args = {
  color: 'default'
}

Body.argTypes = {
  color: {
    name: 'Color',
    control: colorControl
  }
}

const meta: Meta = {
  title: 'Cooler/Body'
}

export default meta
