import { lazy, Suspense } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { Cooler } from './components/Cooler/Cooler'
import { foldLocation, Router } from './components/Router'
import { LoadingBlock } from './components/Loading/LoadingBlock'
import { AccountProvider } from './contexts/AccountContext'
import { ConfigProvider } from './contexts/ConfigContext'
import { pipe } from 'fp-ts/function'
import { Menu } from './components/Menu/Menu'
import { Content } from './components/Content/Content'

const Profile = lazy(() => import('./pages/Profile/Profile'))

export function App() {
  return (
    <ConfigProvider>
      <ThemeProvider>
        <Cooler>
          <AccountProvider>
            <Suspense fallback={<LoadingBlock />}>
              <Router
                render={location => (
                  <>
                    <Menu />
                    <Content>
                      {pipe(
                        location,
                        foldLocation({
                          Home: () => <Profile />,
                          Clients: () => <p>Clients</p>,
                          Projects: () => <p>Projects</p>
                        })
                      )}
                    </Content>
                  </>
                )}
              />
            </Suspense>
          </AccountProvider>
        </Cooler>
      </ThemeProvider>
    </ConfigProvider>
  )
}
