import { Meta, Story } from '@storybook/react'
import { option } from 'fp-ts'
import { checkmark, heart, skull, star, warning } from 'ionicons/icons'
import { unsafeLocalizedString } from '../a18n'
import { Content } from '../components/Content/Content'
import { List } from '../components/List/List'
import { CoolerStory } from './CoolerStory'

export const Readonly: Story = args => (
  <CoolerStory>
    <Content>
      <List
        type="readonly"
        heading={option.some(unsafeLocalizedString('Read-only list'))}
        unwrapDescriptions={args.unwrapDescriptions}
        items={[
          {
            label: option.none,
            content: unsafeLocalizedString('Content only item'),
            description: option.none
          },
          {
            label: option.some(unsafeLocalizedString('Label')),
            content: unsafeLocalizedString('Label and content'),
            description: option.none
          },
          {
            label: option.some(unsafeLocalizedString('Another label')),
            content: unsafeLocalizedString('Label and content and description'),
            description: option.some(
              unsafeLocalizedString(
                'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Corporis autem ex vel aliquid enim commodi laudantium esse eos eligendi ullam, ratione ipsam iste dolorem consectetur nesciunt at incidunt eveniet hic.'
              )
            )
          }
        ]}
      />
      <List
        type="withIcons"
        iconsPosition="start"
        heading={option.some(
          unsafeLocalizedString('List with icons at the start')
        )}
        unwrapDescriptions={args.unwrapDescriptions}
        items={[
          {
            label: option.some(
              unsafeLocalizedString('Item with icon at the start')
            ),
            content: unsafeLocalizedString('Default icon color'),
            description: option.none,
            icon: star
          },
          {
            label: option.some(
              unsafeLocalizedString('Item with icon at the start')
            ),
            content: unsafeLocalizedString('Primary icon color'),
            description: option.none,
            icon: heart,
            iconColor: 'primary'
          },
          {
            label: option.some(
              unsafeLocalizedString('Item with icon at the start')
            ),
            content: unsafeLocalizedString('Success icon color'),
            description: option.none,
            icon: checkmark,
            iconColor: 'success'
          },
          {
            label: option.some(
              unsafeLocalizedString('Item with icon at the start')
            ),
            content: unsafeLocalizedString('Warning icon color'),
            description: option.none,
            icon: warning,
            iconColor: 'warning'
          },
          {
            label: option.some(
              unsafeLocalizedString('Item with icon at the start')
            ),
            content: unsafeLocalizedString('Danger icon color'),
            description: option.none,
            icon: skull,
            iconColor: 'danger'
          }
        ]}
      />
      <List
        type="withIcons"
        iconsPosition="end"
        heading={option.some(
          unsafeLocalizedString('List with icons at the end')
        )}
        unwrapDescriptions={args.unwrapDescriptions}
        items={[
          {
            label: option.some(
              unsafeLocalizedString('Item with icon at the end')
            ),
            content: unsafeLocalizedString('Default icon color'),
            description: option.none,
            icon: star
          },
          {
            label: option.some(
              unsafeLocalizedString('Item with icon at the end')
            ),
            content: unsafeLocalizedString('Primary icon color'),
            description: option.none,
            icon: heart,
            iconColor: 'primary'
          },
          {
            label: option.some(
              unsafeLocalizedString('Item with icon at the end')
            ),
            content: unsafeLocalizedString('Success icon color'),
            description: option.none,
            icon: checkmark,
            iconColor: 'success'
          },
          {
            label: option.some(
              unsafeLocalizedString('Item with icon at the end')
            ),
            content: unsafeLocalizedString('Warning icon color'),
            description: option.none,
            icon: warning,
            iconColor: 'warning'
          },
          {
            label: option.some(
              unsafeLocalizedString('Item with icon at the end')
            ),
            content: unsafeLocalizedString('Danger icon color'),
            description: option.none,
            icon: skull,
            iconColor: 'danger'
          }
        ]}
      />
    </Content>
  </CoolerStory>
)

const meta: Meta = {
  title: 'Cooler/List',
  component: Readonly,
  args: {
    unwrapDescriptions: false
  }
}

export default meta
