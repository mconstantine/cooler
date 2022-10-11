import { CyHttpMessages, Method } from 'cypress/types/net-stubbing'

declare global {
  namespace Cypress {
    interface Chainable {
      mockApiCall: typeof mockApiCall
      mockApiCallWithError: typeof mockApiCallWithError
      mockApiConnection: typeof mockApiConnection
      skipLogin: typeof skipLogin
    }
  }
}

const apiUrl = Cypress.env('apiUrl')

function mockApiCall<T>(
  method: Method,
  path: string,
  data: T | string
): Cypress.Chainable<null> {
  return cy.intercept(method, `${apiUrl}${path}`, req => {
    req.reply(typeof data === 'string' ? { fixture: data } : { body: data })
  })
}
Cypress.Commands.add('mockApiCall', mockApiCall)

function mockApiCallWithError(
  method: Method,
  path: string,
  status: number,
  message: string
): Cypress.Chainable<null> {
  return cy.intercept(method, `${apiUrl}${path}`, req => {
    req.reply(status, { status, message })
  })
}
Cypress.Commands.add('mockApiCallWithError', mockApiCallWithError)

function skipLogin() {
  localStorage.setItem(
    'account',
    JSON.stringify({
      accessToken: 'some-access-token',
      refreshToken: 'some-refresh-token',
      expiration: new Date(Date.now() + 86400000).toISOString()
    })
  )
}
Cypress.Commands.add('skipLogin', skipLogin)

function mockApiConnection<T>(
  path: string,
  allData: T[] | string,
  searchField: keyof T
): Cypress.Chainable<null> {
  const handleData = (req: CyHttpMessages.IncomingHttpRequest, data: T[]) => {
    const query: string | null = req.query['query']?.toString() ?? null
    const first: string | null = req.query['first']?.toString() ?? null
    const last: string | null = req.query['last']?.toString() ?? null
    const after: string | null = req.query['after']?.toString() ?? null
    const before: string | null = req.query['before']?.toString() ?? null

    const pattern: RegExp | null = query ? new RegExp(query, 'i') : null

    const filtered = pattern
      ? data.filter(item => pattern.test(item[searchField] as string))
      : data

    const target: number =
      (after
        ? filtered.findIndex(item => item[searchField] === after)
        : before
        ? filtered.reverse().findIndex(item => item[searchField] === before)
        : -1) + 1

    const sliced = first
      ? filtered.slice(target, target + parseInt(first))
      : last
      ? filtered.reverse().slice(target, target + parseInt(last))
      : filtered

    return {
      pageInfo: {
        totalCount: filtered.length,
        startCursor: sliced[0][searchField] || null,
        endCursor: sliced[sliced.length - 1][searchField] || null,
        hasPreviousPage: !!before || !!after,
        hasNextPage: target + sliced.length < filtered.length
      },
      edges: sliced.map(item => ({
        cursor: item[searchField] || null,
        node: item
      }))
    }
  }

  if (typeof allData === 'string') {
    return cy
      .fixture<T[]>(allData)
      .then(data =>
        cy.intercept('GET', `${apiUrl}${path}?*`, req =>
          req.reply(handleData(req, data))
        )
      )
  } else {
    return cy.intercept('GET', `${apiUrl}${path}?*`, req =>
      req.reply(handleData(req, allData))
    )
  }
}
Cypress.Commands.add('mockApiConnection', mockApiConnection)
