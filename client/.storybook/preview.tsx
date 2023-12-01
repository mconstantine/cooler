import React, { PropsWithChildren, useEffect } from 'react'
import type { Decorator, Preview } from '@storybook/react'
import { Theme, ThemeProvider, useTheme } from '../src/contexts/ThemeContext'

function ThemedStory(props: PropsWithChildren<{ theme: Theme }>) {
  const { setTheme } = useTheme()

  useEffect(() => {
    setTheme(props.theme)
  })

  return props.children
}

const withTheme: Decorator = (story, context) => {
  const theme = context.globals.theme as Theme

  return (
    <ThemeProvider>
      <ThemedStory theme={theme}>{story()}</ThemedStory>
    </ThemeProvider>
  )
}

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      }
    }
  },
  decorators: [withTheme],
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          {
            value: 'light',
            icon: 'circlehollow',
            title: 'light'
          },
          {
            value: 'dark',
            icon: 'circle',
            title: 'dark'
          }
        ] satisfies Array<{ value: Theme, icon: string, title: string }>,
        showName: true
      }
    }
  }
}

export default preview
