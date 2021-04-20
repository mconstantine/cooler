const apiUrl = Cypress.env('apiUrl')

declare namespace Cypress {
  interface Chainable {
    mockApiCall: typeof mockApiCall
  }
}

function mockApiCall<T>(
  operationName: string,
  body: Record<string, T>,
  statusCode?: number
): Cypress.Chainable<null>
function mockApiCall(
  operationName: string,
  fixture: string
): Cypress.Chainable<null>
function mockApiCall<T>(
  operationName: string,
  body: string | Record<string, T>,
  statusCode: number = 200
): Cypress.Chainable<null> {
  return cy.intercept('POST', apiUrl, req => {
    if (req.body.operationName === operationName) {
      req.reply(
        typeof body === 'string' ? { fixture: body } : { statusCode, body }
      )
    }
  })
}

Cypress.Commands.add('mockApiCall', mockApiCall)
