import clients from '../fixtures/clients.json'
import privateClient from '../fixtures/private-client.json'
import businessClient from '../fixtures/business-client.json'

interface PrivateClient {
  type: 'PRIVATE'
  id: number
  first_name: string
  last_name: string
}

interface BusinessClient {
  type: 'BUSINESS'
  id: number
  business_name: string
}

type Client = PrivateClient | BusinessClient

describe('Clients pages', () => {
  beforeEach(() => {
    cy.skipLogin()
    cy.mockApiConnection('clients', clients as Client[], (client: Client) => {
      switch (client.type) {
        case 'PRIVATE':
          return `${client.first_name} ${client.last_name}`
        case 'BUSINESS':
          return client.business_name
      }
    }).as('clients')
  })

  describe('Clients list page', () => {
    beforeEach(() => {
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
      cy.findByRole('textbox', { name: 'Search' }).type('Group')
      cy.wait('@clients')
      cy.findAllByRole('listitem').should('have.length', 3)
      cy.findByRole('button', { name: 'Load more' }).should('not.exist')
    })
  })

  describe('Client creation', () => {
    beforeEach(() => {
      cy.visit('/clients/new')
    })

    it('should be able to create a private client', () => {
      const data = privateClient.data.client

      cy.mockApiCall('createClient', {
        createClient: privateClient.data.client
      }).as('createClient')

      cy.findByRole('heading', { name: 'New client' }).should('be.visible')
      cy.findByRole('textbox', { name: 'Client type' }).click()
      cy.findByRole('listitem', { name: 'Private' }).click()
      cy.findByRole('textbox', { name: 'First name' }).type(data.first_name)
      cy.findByRole('textbox', { name: 'Last name' }).type(data.last_name)
      cy.findByRole('textbox', { name: 'Fiscal code' }).type(data.fiscal_code)
      cy.findByRole('textbox', { name: 'Address – country' }).click()
      cy.findByRole('listitem', { name: 'Italia' }).click()
      cy.findByRole('textbox', { name: 'Address – province' }).click()
      cy.findByRole('listitem', { name: 'Reggio-Emilia' }).click()
      cy.findByRole('textbox', { name: 'Address – city' }).type(
        data.address_city
      )
      cy.findByRole('textbox', { name: 'Address – ZIP code' }).type(
        data.address_zip
      )
      cy.findByRole('textbox', { name: 'Address – street' }).type(
        data.address_street
      )
      cy.findByRole('textbox', { name: 'Address – street number' }).type(
        data.address_street_number
      )
      cy.findByRole('textbox', { name: 'E-mail address' }).type(
        data.address_email
      )
      cy.findByRole('button', { name: 'Submit' }).click()
      cy.wait('@createClient')
      cy.url().should('eq', Cypress.config().baseUrl + '/clients/all')
    })

    it('should be able to create a business client', () => {
      const data = businessClient.data.client

      cy.mockApiCall('createClient', {
        createClient: businessClient.data.client
      }).as('createClient')

      cy.findByRole('heading', { name: 'New client' }).should('be.visible')
      cy.findByRole('textbox', { name: 'Client type' }).click()
      cy.findByRole('listitem', { name: 'Business' }).click()
      cy.findByRole('textbox', { name: 'Business name' }).type(
        data.business_name
      )
      cy.findByRole('textbox', { name: 'Country' }).click()
      cy.findByRole('listitem', { name: 'Italia' }).click()
      cy.findByRole('textbox', { name: 'VAT number' }).type(data.vat_number)
      cy.findByRole('textbox', { name: 'Address – country' }).click()
      cy.findByRole('listitem', { name: 'Italia' }).click()
      cy.findByRole('textbox', { name: 'Address – province' }).click()
      cy.findByRole('listitem', { name: 'Reggio-Emilia' }).click()
      cy.findByRole('textbox', { name: 'Address – city' }).type(
        data.address_city
      )
      cy.findByRole('textbox', { name: 'Address – ZIP code' }).type(
        data.address_zip
      )
      cy.findByRole('textbox', { name: 'Address – street' }).type(
        data.address_street
      )
      cy.findByRole('textbox', { name: 'Address – street number' }).type(
        data.address_street_number
      )
      cy.findByRole('textbox', { name: 'E-mail address' }).type(
        data.address_email
      )
      cy.findByRole('button', { name: 'Submit' }).click()
      cy.wait('@createClient')
      cy.url().should('eq', Cypress.config().baseUrl + '/clients/all')
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
      cy.mockApiCall('client', 'private-client').as('client')
      cy.visit('/clients/42')
      cy.wait('@client')
    })

    it('should allow to edit a client', () => {
      const newFirstName = 'Mario'
      const newLastName = 'Cansi'

      cy.mockApiCall('updateClient', {
        updateClient: {
          ...privateClient.data.client,
          first_name: newFirstName,
          last_name: newLastName,
          updated_at: new Date().toISOString()
        }
      }).as('updateClient')

      cy.findByRole('heading', { name: 'Maria Cansas' }).should('be.visible')
      cy.findByRole('button', { name: 'Edit' }).click()
      cy.findByRole('textbox', { name: 'First name' })
        .clear()
        .type(newFirstName)
      cy.findByRole('textbox', { name: 'Last name' }).clear().type(newLastName)
      cy.findByRole('button', { name: 'Submit' }).click()
      cy.wait('@updateClient')
      cy.findByRole('heading', {
        name: `${newFirstName} ${newLastName}`
      }).should('be.visible')
      cy.findByRole('textbox', { name: 'First name' })
        .invoke('val')
        .should('eq', newFirstName)
      cy.findByRole('textbox', { name: 'Last name' })
        .invoke('val')
        .should('eq', newLastName)
    })

    it('should allow to delete a client', () => {
      cy.mockApiCall('deleteClient', {
        deleteClient: privateClient.data.client
      }).as('deleteClient')

      cy.findByRole('heading', { name: 'Maria Cansas' }).should('be.visible')
      cy.findByRole('button', { name: 'Delete' }).click()
      cy.findByRole('button', { name: 'Confirm' }).click()
      cy.wait('@deleteClient')
      cy.url().should('eq', Cypress.config().baseUrl + '/clients/all')
    })
  })
})
