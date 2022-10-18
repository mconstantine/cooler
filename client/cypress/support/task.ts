import task from '../fixtures/task.json'
import tasks from '../fixtures/tasks.json'

declare global {
  namespace Cypress {
    interface Chainable {
      mockTaskCalls: typeof mockTaskCalls
    }
  }
}

function mockTaskCalls() {
  cy.mockApiConnection(
    `/sessions/task/${task._id.$oid}`,
    'sessions',
    'startTime'
  ).as('sessions')

  cy.mockApiCall('GET', '/tasks/*/previous', tasks[1]).as('getPreviousTask')
  cy.mockApiCall('GET', '/tasks/*/next', tasks[2]).as('getNextTask')
}
Cypress.Commands.add('mockTaskCalls', mockTaskCalls)

export default {}
