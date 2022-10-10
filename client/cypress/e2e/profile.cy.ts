import profile from '../fixtures/profileData.json'

describe('Profile page', () => {
  beforeEach(() => {
    cy.skipLogin()
    cy.mockProfileCalls()
    cy.visit('/')

    cy.wait('@me')
    cy.wait('@taxes')
    cy.wait('@stats')
    cy.wait('@cashedBalance')
    cy.wait('@tasksDueToday')
    cy.wait('@latestProjects')
    cy.wait('@openSessions')
  })

  it('should display user data', () => {
    cy.findByRole('heading', { name: 'Your data' }).should('be.visible')
    cy.findByRole('textbox', { name: 'Name' }).should('be.visible')
    cy.findByRole('textbox', { name: 'E-mail address' }).should('be.visible')
    cy.findByRole('textbox', { name: 'Created at' }).should('be.visible')
    cy.findByRole('textbox', { name: 'Last updated at' }).should('be.visible')
  })

  it('should allow to change name', () => {
    const newName = 'Some new name'

    cy.findByRole('button', { name: 'Edit' }).click()
    cy.findByRole('textbox', { name: 'Name' }).clear().type(newName)

    cy.mockApiCall('PUT', '/users/me', {
      ...profile,
      name: newName,
      updated_at: new Date().toISOString()
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

    cy.mockApiCall('PUT', '/users/me', {
      ...profile,
      email: newEmail,
      updated_at: new Date().toISOString()
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

    cy.mockApiCall('PUT', '/users/me', {
      ...profile,
      updated_at: new Date().toISOString()
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
    cy.mockApiCall('DELETE', '/users/me', profile).as('deleteProfile')

    cy.findByRole('button', { name: 'Delete profile' }).click()
    cy.findByRole('button', { name: 'Confirm' }).click()
    cy.wait('@deleteProfile')
    cy.findByRole('heading', { name: 'Login' }).should('be.visible')
  })

  it('should correctly switch "since" date for current situation', () => {
    cy.findAllByRole('textbox', { name: 'Since' }).invoke('first').click()
    cy.findByRole('textbox', { name: 'Year' }).clear().type('2021')
    cy.findByRole('textbox', { name: 'Month' }).clear().type('April').blur()
    cy.findAllByRole('button', { name: '30' }).invoke('last').click()
    cy.findByRole('button', { name: 'Confirm' }).click()

    cy.wait('@stats').then(interception => {
      const url = new URL(interception.request.url)
      const sinceString = url.searchParams.get('since')
      const since = new Date(sinceString || Date.now())

      expect(since.getFullYear()).to.eq(2021)
      expect(since.getMonth()).to.eq(3)
      expect(since.getDate()).to.eq(30)
    })
  })

  it('should correctly switch "until" date for current situation', () => {
    cy.findAllByRole('textbox', { name: 'Until' }).invoke('first').click()
    cy.findByRole('textbox', { name: 'Year' }).clear().type('2100')
    cy.findByRole('textbox', { name: 'Month' }).clear().type('February').blur()
    cy.findAllByRole('button', { name: '1' }).invoke('last').click()
    cy.findByRole('button', { name: 'Confirm' }).click()

    cy.wait('@stats').then(interception => {
      const url = new URL(interception.request.url)
      const sinceString = url.searchParams.get('to')
      const since = new Date(sinceString || Date.now())

      expect(since.getFullYear()).to.eq(2100)
      expect(since.getMonth()).to.eq(1)
      expect(since.getDate()).to.eq(1)
    })
  })

  it('should correctly switch "since" date for cashed balance', () => {
    cy.findAllByRole('textbox', { name: 'Since' }).invoke('eq', 1).click()
    cy.findByRole('textbox', { name: 'Year' }).clear().type('2021')
    cy.findByRole('textbox', { name: 'Month' }).clear().type('April').blur()
    cy.findAllByRole('button', { name: '30' }).invoke('last').click()
    cy.findByRole('button', { name: 'Confirm' }).click()

    cy.wait('@cashedBalance').then(interception => {
      const url = new URL(interception.request.url)
      const sinceString = url.searchParams.get('since')
      const since = new Date(sinceString || Date.now())

      expect(since.getFullYear()).to.eq(2021)
      expect(since.getMonth()).to.eq(3)
      expect(since.getDate()).to.eq(30)
    })
  })

  it('should correctly switch "until" date for cashed balance', () => {
    cy.findAllByRole('textbox', { name: 'Until' }).invoke('eq', 1).click()
    cy.findByRole('textbox', { name: 'Year' }).clear().type('2100')
    cy.findByRole('textbox', { name: 'Month' }).clear().type('February').blur()
    cy.findAllByRole('button', { name: '1' }).invoke('first').click()
    cy.findByRole('button', { name: 'Confirm' }).click()

    cy.wait('@cashedBalance').then(interception => {
      const url = new URL(interception.request.url)
      const sinceString = url.searchParams.get('to')
      const since = new Date(sinceString || Date.now())

      expect(since.getFullYear()).to.eq(2100)
      expect(since.getMonth()).to.eq(1)
      expect(since.getDate()).to.eq(1)
    })
  })
})
