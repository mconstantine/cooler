import { Meta, StoryObj } from '@storybook/react'
import { option } from 'fp-ts'
import { useState } from 'react'
import { unsafeLocalizedString } from '../a18n'
import { Body } from '../components/Body/Body'
import { Button } from '../components/Button/Button/Button'
import { Content } from '../components/Content/Content'
import { List } from '../components/List/List'
import { Modal } from '../components/Modal/Modal'
import { Separator } from '../components/Separator/Separator'

const meta: Meta<typeof Modal> = {
  title: 'Cooler/Modal',
  component: Modal,
  parameters: {},
  tags: ['autodocs']
}

export default meta
type Story = StoryObj<typeof Modal>

export const Default: Story = {
  render: function Story() {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
      <Content>
        <Modal
          framed
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        >
          <List
            heading={option.none}
            emptyListMessage={unsafeLocalizedString('')}
            items={new Array(30).fill(null).map((_, index) => ({
              key: index,
              type: 'routed',
              label: option.none,
              content: unsafeLocalizedString('Some list item'),
              description: option.none,
              action: () => setIsModalOpen(false)
            }))}
          />
        </Modal>

        <Button
          type="button"
          label={unsafeLocalizedString('Open the modal')}
          action={() => setIsModalOpen(true)}
          icon={option.none}
        />

        <Separator />

        <Body>
          {unsafeLocalizedString(
            'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ea eum vel porro recusandae nesciunt itaque pariatur nemo omnis consequuntur fuga? Quaerat molestiae quo sit tenetur, voluptatibus animi modi id quae vero suscipit, perspiciatis maiores veritatis sed earum praesentium quod reprehenderit qui? Error quod suscipit placeat perferendis deleniti ipsa assumenda? Eaque in porro accusantium, atque veniam praesentium, aliquid molestiae delectus corporis necessitatibus nostrum eos est accusamus illum vero deleniti quis blanditiis at nam aperiam earum ipsa? Suscipit dignissimos laborum quis amet vitae possimus fugit dicta, culpa deserunt facilis harum accusamus porro ipsam inventore ducimus recusandae magni veritatis natus aliquid tenetur adipisci. Dolore inventore earum iure delectus quasi. Blanditiis nostrum nisi in quibusdam quis! Reprehenderit molestias magni saepe cum perspiciatis cumque nihil, ullam cupiditate facere voluptas vitae tempora. Ipsa excepturi velit quisquam neque in nam magnam, sunt libero unde repellat voluptatem sint quis reprehenderit doloremque, fugiat sapiente dicta, laborum laboriosam qui reiciendis.'
          )}
        </Body>

        <Body>
          {unsafeLocalizedString(
            'Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ea eum vel porro recusandae nesciunt itaque pariatur nemo omnis consequuntur fuga? Quaerat molestiae quo sit tenetur, voluptatibus animi modi id quae vero suscipit, perspiciatis maiores veritatis sed earum praesentium quod reprehenderit qui? Error quod suscipit placeat perferendis deleniti ipsa assumenda? Eaque in porro accusantium, atque veniam praesentium, aliquid molestiae delectus corporis necessitatibus nostrum eos est accusamus illum vero deleniti quis blanditiis at nam aperiam earum ipsa? Suscipit dignissimos laborum quis amet vitae possimus fugit dicta, culpa deserunt facilis harum accusamus porro ipsam inventore ducimus recusandae magni veritatis natus aliquid tenetur adipisci. Dolore inventore earum iure delectus quasi. Blanditiis nostrum nisi in quibusdam quis! Reprehenderit molestias magni saepe cum perspiciatis cumque nihil, ullam cupiditate facere voluptas vitae tempora. Ipsa excepturi velit quisquam neque in nam magnam, sunt libero unde repellat voluptatem sint quis reprehenderit doloremque, fugiat sapiente dicta, laborum laboriosam qui reiciendis.'
          )}
        </Body>
      </Content>
    )
  }
}
