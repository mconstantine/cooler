import * as t from 'io-ts'
import { Session } from '../../src/entities/Session'

declare global {
  namespace Cypress {
    interface Chainable {
      mockOpenSessionsCall: typeof mockOpenSessionsCall
    }
  }
}

function mockOpenSessionsCall() {
  cy.mockApiCall<t.OutputOf<typeof Session>[]>('GET', '/sessions/open', []).as(
    'openSessions'
  )
}
Cypress.Commands.add('mockOpenSessionsCall', mockOpenSessionsCall)
