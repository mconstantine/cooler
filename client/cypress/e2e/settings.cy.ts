import ObjectID from 'bson-objectid'
import * as t from 'io-ts'
import { Tax } from '../../src/entities/Tax'
import { unsafeObjectIdStringFromServer } from '../../src/globalDomain'

describe('Settings page', () => {
  beforeEach(() => {
    cy.skipLogin()
    cy.mockProfileCalls()
    cy.visit('/')

    cy.wait('@me')
    cy.wait('@taxes')
    cy.wait('@stats')
    cy.wait('@cashedBalance')
    cy.wait('@tasksDueToday')
    cy.wait('@latestProjects')
    cy.wait('@openSessions')

    cy.findByRole('button', { name: 'Settings' }).click()
  })

  it('should allow to manipulate taxes', () => {
    const taxId = unsafeObjectIdStringFromServer(new ObjectID().toHexString())
    const taxLabel = 'Test tax'
    const taxValue = 0.42
    const updatedTaxLabel = 'Test tax updated'
    const updatedTaxValue = 0.245

    cy.mockApiCall<t.OutputOf<typeof Tax>>('POST', '/taxes', {
      _id: taxId,
      label: taxLabel,
      value: taxValue
    }).as('createTax')

    cy.mockApiCall<t.OutputOf<typeof Tax>>('PUT', `/taxes/${taxId.$oid}`, {
      _id: taxId,
      label: updatedTaxLabel,
      value: updatedTaxValue
    }).as('updateTax')

    cy.mockApiCall('DELETE', `/taxes/${taxId.$oid}`, {
      _id: taxId,
      label: updatedTaxLabel,
      value: updatedTaxValue
    }).as('deleteTax')

    cy.findByRole('button', { name: 'New tax' }).click()
    cy.findByRole('textbox', { name: 'Name' }).type(taxLabel)

    cy.findByRole('textbox', { name: 'Value (%)' }).type(
      (taxValue * 100).toString(10)
    )

    cy.findByRole('button', { name: 'Submit' }).click()
    cy.wait('@createTax')
    cy.findByText(taxLabel).should('be.visible')
    cy.findByText(`${(taxValue * 100).toFixed(2)}%`).should('be.visible')

    cy.findAllByRole('button', { name: 'Edit' }).invoke('first').click()

    cy.findByRole('textbox', { name: 'Name' })
      .invoke('val')
      .should('eq', taxLabel)

    cy.findByRole('textbox', { name: 'Name' }).clear().type(updatedTaxLabel)

    cy.findByRole('textbox', { name: 'Value (%)' })
      .invoke('val')
      .should('eq', (taxValue * 100).toFixed(2))

    cy.findByRole('textbox', { name: 'Value (%)' })
      .clear()
      .type((updatedTaxValue * 100).toString(10))

    cy.findByRole('button', { name: 'Submit' }).click()
    cy.wait('@updateTax')

    cy.findByText(updatedTaxLabel).should('be.visible')
    cy.findByText(`${(updatedTaxValue * 100).toFixed(2)}%`).should('be.visible')
    cy.findAllByRole('button', { name: 'Delete tax' }).invoke('first').click()
    cy.findByRole('button', { name: 'Confirm' }).click()
    cy.wait('@deleteTax')
    cy.findByText(updatedTaxLabel).should('not.exist')
    cy.findByText(`${(updatedTaxValue * 100).toFixed(2)}%`).should('not.exist')
  })
})
