import { localizedMonthNames } from '../../src/a18n'
import { unsafeNonNegativeInteger } from '../../src/globalDomain'

declare global {
  namespace Cypress {
    interface Chainable {
      setCalendar: typeof setCalendar
    }
  }
}

function setCalendar(
  element: Cypress.Chainable<JQuery<HTMLElement>>,
  date: Date
): Cypress.Chainable<JQuery<HTMLElement>> {
  const monthString =
    localizedMonthNames[unsafeNonNegativeInteger(date.getMonth())]

  element.click()
  cy.findByRole('textbox', { name: 'Year' })
    .clear()
    .type(date.getFullYear().toString(10))
  cy.findByRole('textbox', { name: 'Month' }).clear().type(monthString).blur()
  cy.findAllByRole('button', { name: date.getDate().toString(10) })
    .invoke('last')
    .click()

  return cy.findByRole('button', { name: 'Confirm' }).click()
}
Cypress.Commands.add('setCalendar', setCalendar)
