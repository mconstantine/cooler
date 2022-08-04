const apiUrl = Cypress.env('apiUrl')

declare namespace Cypress {
  interface Chainable {
    mockApiCall: typeof mockApiCall
    mockApiCallWithError: typeof mockApiCallWithError
    mockApiConnection: typeof mockApiConnection
    skipLogin: typeof skipLogin
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
    if (req.body.operationName !== operationName) {
      return
    }

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
  })
}
Cypress.Commands.add('mockApiCallWithError', mockApiCallWithError)

function skipLogin() {
  localStorage.setItem(
    'account',
    JSON.stringify({
      type: 'loggedIn',
      accessToken: 'some-access-token',
      refreshToken: 'some-refresh-token',
      expiration: new Date(Date.now() + 86400000)
    })
  )
}
Cypress.Commands.add('skipLogin', skipLogin)

function mockApiConnection<T extends { id: number }>(
  operationName: string,
  allData: T[],
  getItemName: (item: T) => string
): Cypress.Chainable<null> {
  return cy.intercept('POST', apiUrl, req => {
    if (req.body.operationName !== operationName) {
      return
    }

    const name: string | null = req.body.variables.name
    const first: number = req.body.variables.first

    const filtered = name
      ? allData.filter(item => new RegExp(name).test(getItemName(item)))
      : allData

    const sliced = filtered.slice(0, first)

    req.reply({
      data: {
        [operationName]: {
          totalCount: allData.length,
          pageInfo: {
            startCursor: btoa(sliced[0].id.toString(10)),
            endCursor: btoa(sliced[sliced.length - 1].id.toString(10)),
            hasPreviousPage: false,
            hasNextPage: sliced.length < filtered.length
          },
          edges: sliced.map(item => ({
            cursor: btoa(item.id.toString(10)),
            node: item
          }))
        }
      }
    })
  })
}
Cypress.Commands.add('mockApiConnection', mockApiConnection)
