import projects from '../fixtures/projects.json'

declare global {
  namespace Cypress {
    interface Chainable {
      mockProjectCalls: typeof mockProjectCalls
    }
  }
}

function mockProjectCalls() {
  cy.mockApiConnection(`/clients`, 'clients', 'businessName').as('clients')
  cy.mockApiCall('GET', `/projects/*`, 'project').as('getProject')
  cy.mockApiCall('GET', '/projects/*/previous', projects[0]).as(
    'getPreviousProject'
  )
  cy.mockApiCall('GET', '/projects/*/next', projects[2]).as('getNextProject')
  cy.mockApiConnection('/tasks', 'tasks', 'name').as('getProjectTasks')
  cy.mockApiConnection('/taxes', 'taxes', 'label').as('getTaxes')
}
Cypress.Commands.add('mockProjectCalls', mockProjectCalls)

export default {}
