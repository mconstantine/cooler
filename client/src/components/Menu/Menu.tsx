import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { moon, sunny } from 'ionicons/icons'
import { FC } from 'react'
import { a18n } from '../../a18n'
import { Button } from '../Button/Button/Button'
import { Buttons } from '../Button/Buttons/Buttons'
import { foldTheme, useTheme } from '../../contexts/ThemeContext'
import './Menu.scss'
import {
  clientsRoute,
  homeRoute,
  isClientsRoute,
  isHomeRoute,
  isProjectsRoute,
  projectsRoute,
  useRouter
} from '../Router'

interface Props {}

export const Menu: FC<Props> = () => {
  const { theme, setTheme } = useTheme()
  const { route, setRoute } = useRouter()

  const switchTheme = () =>
    setTheme(
      pipe(
        theme,
        foldTheme(
          () => 'dark',
          () => 'light'
        )
      )
    )

  return (
    <div className="Menu">
      <Buttons>
        <Button
          type="iconButton"
          action={switchTheme}
          icon={pipe(
            theme,
            foldTheme(
              () => moon,
              () => sunny
            )
          )}
        />
        <Button
          type="button"
          label={a18n`Clients`}
          icon={option.none}
          action={() => setRoute(clientsRoute('all'))}
          flat
          active={isClientsRoute(route)}
        />
        <Button
          type="button"
          label={a18n`Projects`}
          icon={option.none}
          action={() => setRoute(projectsRoute())}
          flat
          active={isProjectsRoute(route)}
        />
        <Button
          type="button"
          label={a18n`Profile`}
          icon={option.none}
          action={() => setRoute(homeRoute())}
          flat
          active={isHomeRoute(route)}
        />
      </Buttons>
    </div>
  )
}
