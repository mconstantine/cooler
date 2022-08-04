import profile from '../fixtures/profile.json'

describe('Profile page', () => {
  beforeEach(() => {
    cy.skipLogin()
    cy.mockApiCall('me', 'profile').as('profile')
    cy.visit('/')
    cy.wait('@profile')
  })

  it('should display user data', () => {
    cy.findByRole('textbox', { name: 'Name' }).should('be.visible')
    cy.findByRole('textbox', { name: 'E-mail address' }).should('be.visible')
    cy.findByRole('textbox', { name: 'Created at' }).should('be.visible')
    cy.findByRole('textbox', { name: 'Last updated at' }).should('be.visible')
  })

  it('should allow to change name', () => {
    const newName = 'Some new name'

    cy.findByRole('button', { name: 'Edit' }).click()
    cy.findByRole('textbox', { name: 'Name' }).clear().type(newName)

    cy.mockApiCall('updateProfile', {
      updateMe: {
        id: profile.data.me.id,
        name: newName,
        email: profile.data.me.email,
        updated_at: new Date().toISOString()
      }
    }).as('updateProfile')

    cy.findByRole('button', { name: 'Submit' }).click()
    cy.wait('@updateProfile')

    cy.findByRole('textbox', { name: 'Name' })
      .invoke('val')
      .should('eq', newName)
  })

  it('should allow to change e-mail address', () => {
    const newEmail = 'some-new-email@example.com'

    cy.findByRole('button', { name: 'Edit' }).click()
    cy.findByRole('textbox', { name: 'E-mail address' }).clear().type(newEmail)

    cy.mockApiCall('updateProfile', {
      updateMe: {
        id: profile.data.me.id,
        name: profile.data.me.name,
        email: newEmail,
        updated_at: new Date().toISOString()
      }
    }).as('updateProfile')

    cy.findByRole('button', { name: 'Submit' }).click()
    cy.wait('@updateProfile')
    cy.findByRole('heading', { name: 'Login' }).should('be.visible')
  })

  it('should allow to change password', () => {
    const newPassword = 'some-new-password'

    cy.findByRole('button', { name: 'Edit' }).click()
    cy.findByLabelText('New password').clear().type(newPassword)
    cy.findByLabelText('New password (again)').clear().type(newPassword)

    cy.mockApiCall('updateProfile', {
      updateMe: {
        id: profile.data.me.id,
        name: profile.data.me.name,
        email: profile.data.me.email,
        updated_at: new Date().toISOString()
      }
    }).as('updateProfile')

    cy.findByRole('button', { name: 'Submit' }).click()
    cy.wait('@updateProfile')
    cy.findByRole('heading', { name: 'Login' }).should('be.visible')
  })

  it('should allow to logout', () => {
    cy.findByRole('button', { name: 'Logout' }).click()
    cy.findByRole('heading', { name: 'Login' }).should('be.visible')
  })

  it('should allow to delete the profile', () => {
    cy.mockApiCall('deleteMe', {
      deleteMe: {
        id: profile.data.me.id
      }
    })

    cy.findByRole('button', { name: 'Delete profile' }).click()
    cy.findByRole('button', { name: 'Confirm' }).click()
    cy.findByRole('heading', { name: 'Login' }).should('be.visible')
  })

  it('should correctly switch "since" date', () => {
    cy.findAllByRole('textbox', { name: 'Since' }).invoke('first').click()
    cy.findByRole('textbox', { name: 'Year' }).clear().type('2021')
    cy.findByRole('textbox', { name: 'Month' }).clear().type('April').blur()
    cy.findAllByRole('button', { name: '30' }).invoke('last').click()
    cy.findByRole('button', { name: 'Confirm' }).click()
    cy.wait('@profile')
  })

  it('should allow to switch to settings page and back', () => {
    cy.findByRole('button', { name: 'Settings' }).click()
    cy.findByRole('heading', { name: 'Settings' }).should('be.visible')
    cy.findByRole('main').findByRole('button', { name: 'Profile' }).click()
    cy.findByRole('heading', { name: 'Profile' }).should('be.visible')
  })
})
