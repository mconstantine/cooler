const apiUrl = Cypress.env('apiUrl')

declare namespace Cypress {
  interface Chainable {
    mockApiCall: typeof mockApiCall
    mockApiCallWithError: typeof mockApiCallWithError
  }
}

function mockApiCall<T>(
  operationName: string,
  data: Record<string, T>
): Cypress.Chainable<null>
function mockApiCall(
  operationName: string,
  fixture: string
): Cypress.Chainable<null>
function mockApiCall<T>(
  operationName: string,
  data: string | Record<string, T>
): Cypress.Chainable<null> {
  return cy.intercept('POST', apiUrl, req => {
    if (req.body.operationName === operationName) {
      req.reply(
        typeof data === 'string' ? { fixture: data } : { body: { data } }
      )
    }
  })
}
Cypress.Commands.add('mockApiCall', mockApiCall)

function mockApiCallWithError(
  operationName: string,
  statusCode: number,
  errorCode: string,
  errorMessage: string
): Cypress.Chainable<null> {
  return cy.intercept('POST', apiUrl, req => {
    if (req.body.operationName === operationName) {
      req.reply({
        statusCode,
        body: {
          errors: [
            {
              extensions: {
                code: errorCode
              },
              message: errorMessage
            }
          ]
        }
      })
    }
  })
}
Cypress.Commands.add('mockApiCallWithError', mockApiCallWithError)
