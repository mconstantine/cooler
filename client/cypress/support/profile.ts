import * as t from 'io-ts'
import ObjectID from 'bson-objectid'
import { unsafeObjectIdStringFromServer } from '../../src/globalDomain'
import {
  CashedBalanceRequestOutput,
  Profile,
  ProfileStats
} from '../../src/pages/Profile/domain'
import { Tax } from '../../src/entities/Tax'
import { Task } from '../../src/entities/Task'
import { Project } from '../../src/entities/Project'
import { Session } from '../../src/entities/Session'

declare global {
  namespace Cypress {
    interface Chainable {
      mockProfileCalls: typeof mockProfileCalls
    }
  }
}

function mockProfileCalls() {
  cy.mockApiCall<t.OutputOf<typeof Profile>>('GET', '/users/me', {
    _id: unsafeObjectIdStringFromServer(new ObjectID().toHexString()),
    name: 'John Doe',
    email: 'john.doe@example.com',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }).as('me')

  cy.mockApiConnection<Tax>('/taxes', 'taxes', 'label').as('taxes')

  cy.mockApiCall<t.OutputOf<typeof ProfileStats>>('GET', '/users/stats?*', {
    expectedWorkingHours: 42,
    actualWorkingHours: 21,
    budget: 4200,
    balance: 2100
  }).as('stats')

  cy.mockApiCall<t.OutputOf<typeof CashedBalanceRequestOutput>>(
    'GET',
    '/projects/cashedBalance?*',
    { balance: 10000 }
  ).as('cashed-balance')

  cy.mockApiCall<t.OutputOf<typeof Task>[]>('GET', '/tasks/due?*', [
    {
      _id: unsafeObjectIdStringFromServer(new ObjectID().toHexString()),
      name: 'Some Task',
      client: {
        _id: unsafeObjectIdStringFromServer(new ObjectID().toHexString()),
        type: 'BUSINESS',
        name: 'Acme Inc.'
      },
      description: null,
      expectedWorkingHours: 8,
      project: {
        _id: unsafeObjectIdStringFromServer(new ObjectID().toHexString()),
        name: 'Some Project'
      },
      hourlyCost: 20,
      startTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]).as('tasks-due-today')

  cy.mockApiConnection<Project>('/projects/latest?*', 'projects', 'name').as(
    'latest-projects'
  )

  cy.mockApiCall<t.OutputOf<typeof Session>[]>('GET', '/sessions/open', []).as(
    'open-sessions'
  )
}
Cypress.Commands.add('mockProfileCalls', mockProfileCalls)
