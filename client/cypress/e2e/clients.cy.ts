import privateClient from '../fixtures/privateClient.json'
import businessClient from '../fixtures/businessClient.json'

describe('Clients pages', () => {
  beforeEach(() => {
    cy.skipLogin()
  })

  describe('Clients list page', () => {
    beforeEach(() => {
      cy.mockOpenSessionsCall()
      cy.mockApiConnection('/clients', 'clients', 'businessName').as('clients')
      cy.visit('/clients/all')
      cy.wait('@clients')
      cy.wait('@clients')
    })

    it('should show clients list', () => {
      cy.findAllByRole('listitem').should('have.length', 20)
      cy.findByRole('button', { name: 'Load more' }).click()
      cy.wait('@clients')
      cy.findAllByRole('listitem').should('have.length', 32)
      cy.findByRole('button', { name: 'Load more' }).should('not.exist')
      cy.findByRole('textbox', { name: 'Search' }).type('2')
      cy.wait('@clients')
      cy.findAllByRole('listitem').should('have.length', 13)
      cy.findByRole('button', { name: 'Load more' }).should('not.exist')
    })

    it('should send to the client creation page', () => {
      cy.findByRole('button', { name: 'New client' }).click()
      cy.url().should('equal', Cypress.config().baseUrl + '/clients/new')
    })
  })

  describe('Client creation', () => {
    beforeEach(() => {
      cy.mockOpenSessionsCall()
      cy.visit('/clients/new')
    })

    it('should be able to create a private client', () => {
      const data = privateClient

      cy.mockApiCall('POST', '/clients', data).as('createClient')
      cy.mockClientCalls()

      cy.findByRole('heading', { name: 'New Client' }).should('be.visible')
      cy.findByRole('textbox', { name: 'Client type' }).click()
      cy.findByRole('listitem', { name: 'Private' }).click()
      cy.findByRole('textbox', { name: 'Fiscal code' }).type(data.fiscalCode)
      cy.findByRole('textbox', { name: 'First name' }).type(data.firstName)
      cy.findByRole('textbox', { name: 'Last name' }).type(data.lastName)
      cy.findByRole('textbox', { name: 'Address – country' }).click()
      cy.findByRole('listitem', { name: 'Italia' }).click()
      cy.findByRole('textbox', { name: 'Address – province' }).click()
      cy.findByRole('listitem', { name: 'Reggio-Emilia' }).click()
      cy.findByRole('textbox', { name: 'Address – city' }).type(data.addressCity)
      cy.findByRole('textbox', { name: 'Address – ZIP code' }).type(data.addressZIP)
      cy.findByRole('textbox', { name: 'Address – street' }).type(data.addressStreet)
      cy.findByRole('textbox', { name: 'Address – street number' }).type(data.addressStreetNumber)
      cy.findByRole('textbox', { name: 'E-mail address' }).type(data.addressEmail)
      cy.findByRole('button', { name: 'Submit' }).click()
      cy.wait('@createClient')
      cy.wait('@getClient')
      cy.wait('@getClientProjects')
      cy.url().should('eq', Cypress.config().baseUrl + `/clients/${data._id.$oid}`)
    })

    it('should be able to create a business client', () => {
      const data = businessClient

      cy.mockApiCall('POST', '/clients', businessClient).as('createClient')
      cy.mockClientCalls()

      cy.findByRole('heading', { name: 'New Client' }).should('be.visible')
      cy.findByRole('textbox', { name: 'Client type' }).click()
      cy.findByRole('listitem', { name: 'Business' }).click()
      cy.findByRole('textbox', { name: 'Business name' }).type(data.businessName)
      cy.findByRole('textbox', { name: 'Country' }).click()
      cy.findByRole('listitem', { name: 'Italia' }).click()
      cy.findByRole('textbox', { name: 'VAT number' }).type(data.vatNumber)
      cy.findByRole('textbox', { name: 'Address – country' }).click()
      cy.findByRole('listitem', { name: 'Italia' }).click()
      cy.findByRole('textbox', { name: 'Address – province' }).click()
      cy.findByRole('listitem', { name: 'Reggio-Emilia' }).click()
      cy.findByRole('textbox', { name: 'Address – city' }).type(data.addressCity)
      cy.findByRole('textbox', { name: 'Address – ZIP code' }).type(data.addressZIP)
      cy.findByRole('textbox', { name: 'Address – street' }).type(data.addressStreet)
      cy.findByRole('textbox', { name: 'Address – street number' }).type(data.addressStreetNumber)
      cy.findByRole('textbox', { name: 'E-mail address' }).type(data.addressEmail)
      cy.findByRole('button', { name: 'Submit' }).click()
      cy.wait('@createClient')
      cy.url().should('eq', Cypress.config().baseUrl + `/clients/${data._id.$oid}`)
    })

    it('should validate fiscal code', () => {
      cy.findByRole('textbox', { name: 'Client type' }).click()
      cy.findByRole('listitem', { name: 'Private' }).click()
      cy.findByRole('textbox', { name: 'Fiscal code' }).type('CNSMRA90P20F205X')
      cy.findByRole('banner', {
        name: 'This does not look like a valid italian fiscal code'
      }).should('be.visible')
      cy.findByRole('textbox', { name: 'Fiscal code' })
        .clear()
        .type('CNSMRA90P20F205W')
      cy.findByRole('banner', {
        name: 'This does not look like a valid italian fiscal code'
      }).should('not.exist')
    })

    it('should validate VAT number', () => {
      cy.findByRole('textbox', { name: 'Client type' }).click()
      cy.findByRole('listitem', { name: 'Business' }).click()
      cy.findByRole('textbox', { name: 'VAT number' }).type('02587970350')
      cy.findByRole('banner', {
        name: 'This does not look like a valid italian VAT number'
      }).should('be.visible')
      cy.findByRole('textbox', { name: 'VAT number' })
        .clear()
        .type('02587970357')
      cy.findByRole('banner', {
        name: 'This does not look like a valid italian VAT number'
      }).should('not.exist')
    })

    it('should validate country and province consistency', () => {
      cy.findByRole('textbox', { name: 'Address – country' }).click()
      cy.findByRole('listitem', { name: 'Italia' }).click()
      cy.findByRole('textbox', { name: 'Address – province' }).click()
      cy.findByRole('listitem', { name: 'Estero' }).click()
      cy.findByRole('textbox', { name: 'Address – country' })
        .invoke('val')
        .should('not.eq', 'Italia')
      cy.findByRole('textbox', { name: 'Address – country' }).click().clear()
      cy.findByRole('listitem', { name: 'Italia' }).click()
      cy.findByRole('textbox', { name: 'Address – country' })
        .invoke('val')
        .should('not.eq', 'Estero')
    })
  })

  describe('Edit client', () => {
    beforeEach(() => {
      cy.mockOpenSessionsCall()
      cy.mockClientCalls()
      cy.visit(`/clients/${businessClient._id.$oid}`)
      cy.wait('@getClient')
      cy.wait('@getClientProjects')
    })

    it('should allow to edit a client', () => {
      const data = privateClient

      cy.mockApiCall('PUT', `/clients/${businessClient._id.$oid}`, 'privateClient').as('updateClient')

      cy.findByRole('heading', { name: businessClient.businessName }).should('be.visible')
      cy.findByRole('button', { name: 'Edit' }).click()
      cy.findByRole('textbox', { name: 'Client type' }).click()
      cy.findByRole('listitem', { name: 'Private' }).click()
      cy.findByRole('textbox', { name: 'Fiscal code' }).type(data.fiscalCode)
      cy.findByRole('textbox', { name: 'First name' }).clear().type(data.firstName)
      cy.findByRole('textbox', { name: 'Last name' }).clear().type(data.lastName)
      cy.findByRole('textbox', { name: 'Address – country' }).click().clear()
      cy.findByRole('listitem', { name: 'Italia' }).click()
      cy.findByRole('textbox', { name: 'Address – province' }).click().clear()
      cy.findByRole('listitem', { name: 'Reggio-Emilia' }).click()
      cy.findByRole('textbox', { name: 'Address – city' }).clear().type(data.addressCity)
      cy.findByRole('textbox', { name: 'Address – ZIP code' }).clear().type(data.addressZIP)
      cy.findByRole('textbox', { name: 'Address – street' }).clear().type(data.addressStreet)
      cy.findByRole('textbox', { name: 'Address – street number' }).clear().type(data.addressStreetNumber)
      cy.findByRole('textbox', { name: 'E-mail address' }).clear().type(data.addressEmail)
      cy.findByRole('button', { name: 'Submit' }).click()

      cy.wait('@updateClient')

      cy.findByRole('heading', {
        name: `${data.firstName} ${data.lastName}`
      }).should('be.visible')

      cy.findByRole('textbox', { name: 'Fiscal code' })
        .invoke('val')
        .should('eq', data.fiscalCode)

      cy.findByRole('textbox', { name: 'First name' })
        .invoke('val')
        .should('eq', data.firstName)

        cy.findByRole('textbox', { name: 'Last name' })
        .invoke('val')
        .should('eq', data.lastName)
    })

    it('should allow to delete a client', () => {
      cy.mockApiConnection('/clients', 'clients', 'businessName')
      cy.mockApiCall('DELETE', `/clients/${businessClient._id.$oid}`, 'businessClient').as('deleteClient')

      cy.findByRole('heading', { name: businessClient.businessName }).should('be.visible')
      cy.findByRole('button', { name: 'Delete client' }).click()
      cy.findByRole('button', { name: 'Confirm' }).click()
      cy.wait('@deleteClient')
      cy.url().should('eq', Cypress.config().baseUrl + '/clients/all')
    })
  })
})
