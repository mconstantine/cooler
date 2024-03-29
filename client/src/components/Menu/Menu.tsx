import { option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { menu, moon, sunny } from 'ionicons/icons'
import { a18n } from '../../a18n'
import { Button } from '../Button/Button/Button'
import { Buttons } from '../Button/Buttons/Buttons'
import { foldTheme, useTheme } from '../../contexts/ThemeContext'
import './Menu.scss'
import {
  clientsRoute,
  homeRoute,
  invoicesRoute,
  isClientsRoute,
  isHomeRoute,
  isInvoicesRoute,
  isProjectsRoute,
  isSettingsRoute,
  isStatsRoute,
  Location,
  projectsRoute,
  settingsRoute,
  statsRoute,
  useRouter
} from '../Router'
import { useState } from 'react'
import { composeClassName } from '../../misc/composeClassName'

export function Menu() {
  const { theme, setTheme } = useTheme()
  const { route, setRoute } = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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

  const setPage = (location: Location, shouldOpenInNewTab: boolean) => {
    setIsMenuOpen(false)
    setRoute(location, shouldOpenInNewTab)
  }

  return (
    <div className={composeClassName('Menu', isMenuOpen ? 'open' : '')}>
      <Button
        className="menuIcon"
        type="iconButton"
        icon={menu}
        action={() => setIsMenuOpen(isMenuOpen => !isMenuOpen)}
      />
      <Buttons className="menuButtons">
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
          action={_ => setPage(clientsRoute('all'), _)}
          flat
          active={isClientsRoute(route)}
        />
        <Button
          type="button"
          label={a18n`Projects`}
          icon={option.none}
          action={_ => setPage(projectsRoute('all'), _)}
          flat
          active={isProjectsRoute(route)}
        />
        <Button
          type="button"
          label={a18n`Invoices`}
          icon={option.none}
          action={_ => setPage(invoicesRoute(), _)}
          flat
          active={isInvoicesRoute(route)}
        />
        <Button
          type="button"
          label={a18n`Profile`}
          icon={option.none}
          action={_ => setPage(homeRoute(), _)}
          flat
          active={isHomeRoute(route)}
        />
        <Button
          type="button"
          label={a18n`Stats`}
          icon={option.none}
          action={_ => setPage(statsRoute(), _)}
          flat
          active={isStatsRoute(route)}
        />
        <Button
          type="button"
          label={a18n`Settings`}
          icon={option.none}
          action={_ => setPage(settingsRoute(), _)}
          flat
          active={isSettingsRoute(route)}
        />
      </Buttons>
    </div>
  )
}
