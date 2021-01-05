import { Meta, Story } from '@storybook/react'
import { Content } from '../components/Content/Content'
import { Loading as LoadingComponent } from '../components/Loading/Loading'
import { CoolerStory } from './CoolerStory'

export const Loading: Story = () => {
  return (
    <CoolerStory>
      <Content>
        <div>
          <LoadingComponent />
          <LoadingComponent color="primary" />
          <LoadingComponent color="success" />
          <LoadingComponent color="warning" />
          <LoadingComponent color="danger" />
        </div>
        <div style={{ marginTop: '12px' }}>
          <LoadingComponent size="medium" />
          <LoadingComponent size="medium" color="primary" />
          <LoadingComponent size="medium" color="success" />
          <LoadingComponent size="medium" color="warning" />
          <LoadingComponent size="medium" color="danger" />
        </div>
        <div style={{ marginTop: '12px' }}>
          <LoadingComponent size="small" />
          <LoadingComponent size="small" color="primary" />
          <LoadingComponent size="small" color="success" />
          <LoadingComponent size="small" color="warning" />
          <LoadingComponent size="small" color="danger" />
        </div>
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Loading'
}

export default meta
