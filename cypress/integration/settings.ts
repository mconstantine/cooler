describe('Settings page', () => {
  beforeEach(() => {
    cy.skipLogin()
    cy.mockApiCall('me', 'profile').as('profile')
    cy.visit('/')
    cy.wait('@profile')
    cy.findByRole('button', { name: 'Settings' }).click()
  })

  it('should allow to manipulate taxes', () => {
    const taxName = 'Some tax'
    const taxValue = 42
    const updatedTaxName = 'Some tax updated'
    const updatedTaxValue = 24.5

    cy.mockApiCall('createTax', {
      createTax: {
        id: 42,
        label: taxName,
        value: taxValue / 100
      }
    }).as('createTax')

    cy.mockApiCall('updateTax', {
      updateTax: {
        id: 42,
        label: updatedTaxName,
        value: updatedTaxValue / 100
      }
    }).as('updateTax')

    cy.mockApiCall('deleteTax', {
      deleteTax: {
        id: 42,
        label: updatedTaxName,
        value: updatedTaxValue / 100
      }
    }).as('deleteTax')

    cy.findByRole('button', { name: 'New tax' }).click()
    cy.findByRole('textbox', { name: 'Name' }).type(taxName)
    cy.findByRole('textbox', { name: 'Value (%)' }).type(taxValue.toString(10))
    cy.findByRole('button', { name: 'Submit' }).click()

    cy.wait('@createTax')
    cy.findByText(taxName).should('be.visible')
    cy.findByText(`${taxValue.toFixed(2)}%`).should('be.visible')

    cy.findAllByRole('button', { name: 'Edit' }).invoke('first').click()
    cy.findByRole('textbox', { name: 'Name' }).clear().type(updatedTaxName)
    cy.findByRole('textbox', { name: 'Value (%)' })
      .clear()
      .type(updatedTaxValue.toString(10))
    cy.findByRole('button', { name: 'Submit' }).click()

    cy.wait('@updateTax')
    cy.findByText(updatedTaxName).should('be.visible')
    cy.findByText(`${updatedTaxValue.toFixed(2)}%`).should('be.visible')

    cy.findAllByRole('button', { name: 'Delete' }).invoke('first').click()
    cy.findByRole('button', { name: 'Confirm' }).click()

    cy.wait('@deleteTax')
    cy.findByText(updatedTaxName).should('not.exist')
    cy.findByText(`${updatedTaxValue.toFixed(2)}%`).should('not.exist')
  })
})
