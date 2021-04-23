describe('Login page', () => {
  it('should render the interface', () => {
    cy.visit('/')
    cy.findByRole('textbox', { name: 'E-mail address' }).should('be.visible')
    cy.findByLabelText('Password').should('be.visible')
    cy.findByRole('button', { name: 'Submit' }).should('be.visible')
  })

  it('should login', async () => {
    const email = 'some-email@example.com'
    const password = 'S0m3P4ssw0rd!'

    cy.mockApiCall('loginUser', {
      loginUser: {
        accessToken: 'some-access-token',
        refreshToken: 'some-refresh-token',
        expiration: new Date(Date.now() + 86400000).toISOString()
      }
    }).as('login')

    cy.mockApiCall('me', 'profile').as('profile')
    cy.visit('/')

    cy.findByRole('textbox', { name: 'E-mail address' }).type(email)
    cy.findByLabelText('Password').type(password)
    cy.findByRole('button', { name: 'Submit' }).click()

    cy.wait('@login')
    cy.wait('@profile')

    cy.url().should('equal', Cypress.config().baseUrl + '/')
    cy.findByRole('heading', { name: 'Profile' }).should('be.visible')
  })

  it('should display errors', () => {
    const errorMessage = 'This is an error, like wrong e-mail or password'

    cy.mockApiCallWithError('loginUser', 400, 'COOLER_400', errorMessage).as(
      'login'
    )

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
