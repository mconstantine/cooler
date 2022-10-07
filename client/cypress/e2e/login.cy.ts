import { LoginOutput } from '../../src/contexts/AccountContext'
import { unsafeNonEmptyString } from '../../src/globalDomain'

describe('Login page', () => {
  it('should render the interface', () => {
    cy.visit('/')
    cy.findByRole('textbox', { name: 'E-mail address' }).should('be.visible')
    cy.findByLabelText('Password').should('be.visible')
    cy.findByRole('button', { name: 'Submit' }).should('be.visible')
  })

  it('should login', () => {
    const email = 'some-email@example.com'
    const password = 'S0m3P4ssw0rd!'

    cy.mockApiCall<LoginOutput>('POST', '/login', {
      accessToken: unsafeNonEmptyString('some-access-token'),
      refreshToken: unsafeNonEmptyString('some-refresh-token'),
      expiration: new Date(Date.now() + 86400000)
    }).as('login')

    cy.mockProfileCalls()

    cy.visit('/')
    cy.findByRole('textbox', { name: 'E-mail address' }).type(email)
    cy.findByLabelText('Password').type(password)
    cy.findByRole('button', { name: 'Submit' }).click()

    cy.wait('@login')
    cy.wait('@me')
    cy.wait('@taxes')
    cy.wait('@stats')
    cy.wait('@cashed-balance')
    cy.wait('@tasks-due-today')
    cy.wait('@latest-projects')
    cy.wait('@open-sessions')

    cy.url().should('equal', Cypress.config().baseUrl + '/')
  })

  it.only('should display errors', () => {
    const errorMessage = 'This is an error, like wrong e-mail or password'

    cy.mockApiCallWithError('POST', '/login', 400, errorMessage).as('login')

    cy.visit('/')
    cy.findByRole('textbox', { name: 'E-mail address' }).type(
      'some-email@example.com'
    )
    cy.findByLabelText('Password').type('password')
    cy.findByRole('button', { name: 'Submit' }).click()

    cy.wait('@login')
    cy.findByRole('banner', { name: errorMessage }).should('be.visible')
  })
})
