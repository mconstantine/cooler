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
  Location,
  projectsRoute,
  settingsRoute,
  useRouter
} from '../Router'
import { useState } from 'react'
import { composeClassName } from '../../misc/composeClassName'
import { Reader } from 'fp-ts/Reader'

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

  const setPage: Reader<Location, void> = location => {
    setIsMenuOpen(false)
    setRoute(location)
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
          action={() => setPage(clientsRoute('all'))}
          flat
          active={isClientsRoute(route)}
        />
        <Button
          type="button"
          label={a18n`Projects`}
          icon={option.none}
          action={() => setPage(projectsRoute('all'))}
          flat
          active={isProjectsRoute(route)}
        />
        <Button
          type="button"
          label={a18n`Invoices`}
          icon={option.none}
          action={() => setPage(invoicesRoute())}
          flat
          active={isInvoicesRoute(route)}
        />
        <Button
          type="button"
          label={a18n`Profile`}
          icon={option.none}
          action={() => setPage(homeRoute())}
          flat
          active={isHomeRoute(route)}
        />
        <Button
          type="button"
          label={a18n`Settings`}
          icon={option.none}
          action={() => setPage(settingsRoute())}
          flat
          active={isSettingsRoute(route)}
        />
      </Buttons>
    </div>
  )
}
