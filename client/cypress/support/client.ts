declare global {
  namespace Cypress {
    interface Chainable {
      mockClientCalls: typeof mockClientCalls
    }
  }
}

function mockClientCalls() {
  cy.mockApiConnection(`/clients/*/projects`, 'projects', 'name').as('getClientProjects')
  cy.mockApiCall('GET', `/clients/*`, 'businessClient').as('getClient')
}
Cypress.Commands.add('mockClientCalls', mockClientCalls)

export default {}
