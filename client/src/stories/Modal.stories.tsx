import { Meta, Story } from '@storybook/react'
import { option } from 'fp-ts'
import { useState } from 'react'
import { unsafeLocalizedString } from '../a18n'
import { Button } from '../components/Button/Button/Button'
import { Content } from '../components/Content/Content'
import { List } from '../components/List/List'
import { Modal as ModalComponent } from '../components/Modal/Modal'
import { Separator } from '../components/Separator/Separator'
import { CoolerStory } from './CoolerStory'

interface Args {
  onChooseItem: (index: number) => void
}

const ModalTemplate: Story<Args> = props => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <CoolerStory>
      <Content>
        <ModalComponent
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        >
          <List
            heading={option.none}
            items={new Array(30).fill(null).map((_, index) => ({
              key: index,
              type: 'routed',
              label: option.none,
              content: unsafeLocalizedString('Some list item'),
              description: option.none,
              action: () => {
                props.onChooseItem(index)
                setIsModalOpen(false)
              }
            }))}
          />
        </ModalComponent>

        <Button
          type="button"
          label={unsafeLocalizedString('Open the modal')}
          action={() => setIsModalOpen(true)}
          icon={option.none}
        />

        <Separator />

        <p>
          Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ea eum vel
          porro recusandae nesciunt itaque pariatur nemo omnis consequuntur
          fuga? Quaerat molestiae quo sit tenetur, voluptatibus animi modi id
          quae vero suscipit, perspiciatis maiores veritatis sed earum
          praesentium quod reprehenderit qui? Error quod suscipit placeat
          perferendis deleniti ipsa assumenda? Eaque in porro accusantium, atque
          veniam praesentium, aliquid molestiae delectus corporis necessitatibus
          nostrum eos est accusamus illum vero deleniti quis blanditiis at nam
          aperiam earum ipsa? Suscipit dignissimos laborum quis amet vitae
          possimus fugit dicta, culpa deserunt facilis harum accusamus porro
          ipsam inventore ducimus recusandae magni veritatis natus aliquid
          tenetur adipisci. Dolore inventore earum iure delectus quasi.
          Blanditiis nostrum nisi in quibusdam quis! Reprehenderit molestias
          magni saepe cum perspiciatis cumque nihil, ullam cupiditate facere
          voluptas vitae tempora. Ipsa excepturi velit quisquam neque in nam
          magnam, sunt libero unde repellat voluptatem sint quis reprehenderit
          doloremque, fugiat sapiente dicta, laborum laboriosam qui reiciendis.
        </p>

        <p>
          Lorem, ipsum dolor sit amet consectetur adipisicing elit. Ea eum vel
          porro recusandae nesciunt itaque pariatur nemo omnis consequuntur
          fuga? Quaerat molestiae quo sit tenetur, voluptatibus animi modi id
          quae vero suscipit, perspiciatis maiores veritatis sed earum
          praesentium quod reprehenderit qui? Error quod suscipit placeat
          perferendis deleniti ipsa assumenda? Eaque in porro accusantium, atque
          veniam praesentium, aliquid molestiae delectus corporis necessitatibus
          nostrum eos est accusamus illum vero deleniti quis blanditiis at nam
          aperiam earum ipsa? Suscipit dignissimos laborum quis amet vitae
          possimus fugit dicta, culpa deserunt facilis harum accusamus porro
          ipsam inventore ducimus recusandae magni veritatis natus aliquid
          tenetur adipisci. Dolore inventore earum iure delectus quasi.
          Blanditiis nostrum nisi in quibusdam quis! Reprehenderit molestias
          magni saepe cum perspiciatis cumque nihil, ullam cupiditate facere
          voluptas vitae tempora. Ipsa excepturi velit quisquam neque in nam
          magnam, sunt libero unde repellat voluptatem sint quis reprehenderit
          doloremque, fugiat sapiente dicta, laborum laboriosam qui reiciendis.
        </p>
      </Content>
    </CoolerStory>
  )
}

export const Modal = ModalTemplate.bind({})

Modal.argTypes = {
  onChooseItem: {
    action: 'item chosen'
  }
}

const meta: Meta = {
  title: 'Cooler/Modal'
}

export default meta
