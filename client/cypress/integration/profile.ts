describe('Profile page', () => {
  it('should display use data', () => {
    cy.skipLogin()
    cy.mockApiCall('me', 'profile').as('profile')
    cy.visit('/')
    cy.wait('@profile')
  })
})
