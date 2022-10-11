import * as t from 'io-ts'
import { Session } from '../../src/entities/Session'

declare global {
  namespace Cypress {
    interface Chainable {
      mockOpenSettingsCall: typeof mockOpenSettingsCall
    }
  }
}

function mockOpenSettingsCall() {
  cy.mockApiCall<t.OutputOf<typeof Session>[]>('GET', '/sessions/open', []).as(
    'openSessions'
  )
}
Cypress.Commands.add('mockOpenSettingsCall', mockOpenSettingsCall)
