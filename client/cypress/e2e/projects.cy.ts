import project from '../fixtures/project.json'

describe('Projects pages', () => {
  beforeEach(() => {
    cy.skipLogin()
  })

  describe('Projects list page', () => {
    beforeEach(() => {
      cy.mockOpenSessionsCall()
      cy.mockApiConnection(`/projects`, 'projects', 'name').as('projects')
      cy.visit('/projects/all')
      cy.wait('@projects')
      cy.wait('@projects')
    })

    it('should show projects list', () => {
      cy.findAllByRole('listitem').should('have.length', 20)
      cy.findByRole('button', { name: 'Load more' }).click()
      cy.wait('@projects')
      cy.findAllByRole('listitem').should('have.length', 32)
      cy.findByRole('button', { name: 'Load more' }).should('not.exist')
      cy.findByRole('textbox', { name: 'Search' }).type('2')
      cy.wait('@projects')
      cy.findAllByRole('listitem').should('have.length', 13)
      cy.findByRole('button', { name: 'Load more' }).should('not.exist')
    })

    it('should send to the project creation page', () => {
      cy.mockApiConnection(`/clients`, 'clients', 'businessName').as('clients')
      cy.findByRole('button', { name: 'New project' }).click()
      cy.url().should('equal', Cypress.config().baseUrl + '/projects/new')
    })

    it('should filter by invoice data', () => {
      cy.findByLabelText('With invoice data').click({ force: true })

      cy.wait('@projects').then(interception =>
        expect(
          new URL(interception.request.url).searchParams.get('withInvoiceData')
        ).to.eq('true')
      )

      cy.findByLabelText('With invoice data').click({ force: true })

      cy.wait('@projects').then(interception =>
        expect(
          new URL(interception.request.url).searchParams.get('withInvoiceData')
        ).to.eq('false')
      )

      cy.findByLabelText('With invoice data').click({ force: true })

      cy.wait('@projects').then(interception =>
        expect(
          new URL(interception.request.url).searchParams.get('withInvoiceData')
        ).to.eq(null)
      )
    })

    it('should filter by cashing data', () => {
      cy.findByLabelText('Cashed').click({ force: true })

      cy.wait('@projects').then(interception =>
        expect(
          new URL(interception.request.url).searchParams.get('cashed')
        ).to.eq('true')
      )

      cy.findByLabelText('Cashed').click({ force: true })

      cy.wait('@projects').then(interception =>
        expect(
          new URL(interception.request.url).searchParams.get('cashed')
        ).to.eq('false')
      )

      cy.findByLabelText('Cashed').click({ force: true })

      cy.wait('@projects').then(interception =>
        expect(
          new URL(interception.request.url).searchParams.get('cashed')
        ).to.eq(null)
      )
    })

    it('should filter started vs not started', () => {
      cy.findByLabelText('Started').click({ force: true })

      cy.wait('@projects').then(interception =>
        expect(
          new URL(interception.request.url).searchParams.get('started')
        ).to.eq('true')
      )

      cy.findByLabelText('Started').click({ force: true })

      cy.wait('@projects').then(interception =>
        expect(
          new URL(interception.request.url).searchParams.get('started')
        ).to.eq('false')
      )

      cy.findByLabelText('Started').click({ force: true })

      cy.wait('@projects').then(interception =>
        expect(
          new URL(interception.request.url).searchParams.get('started')
        ).to.eq(null)
      )
    })

    it('should filter ended vs not ended', () => {
      cy.findByLabelText('Ended').click({ force: true })

      cy.wait('@projects').then(interception =>
        expect(
          new URL(interception.request.url).searchParams.get('ended')
        ).to.eq('true')
      )

      cy.findByLabelText('Ended').click({ force: true })

      cy.wait('@projects').then(interception =>
        expect(
          new URL(interception.request.url).searchParams.get('ended')
        ).to.eq('false')
      )

      cy.findByLabelText('Ended').click({ force: true })

      cy.wait('@projects').then(interception =>
        expect(
          new URL(interception.request.url).searchParams.get('ended')
        ).to.eq(null)
      )
    })

    it('should cache the filters', () => {
      cy.mockApiConnection(`/clients`, 'clients', 'businessName').as('clients')

      cy.findByLabelText('With invoice data').click({ force: true })
      cy.wait('@projects')
      cy.findByLabelText('Cashed').click({ force: true })
      cy.wait('@projects')
      cy.findByLabelText('Started').click({ force: true })
      cy.wait('@projects')
      cy.findByLabelText('Ended').click({ force: true })
      cy.wait('@projects')

      cy.findByRole('button', { name: 'New project' }).click()
      cy.findByRole('button', { name: 'Cancel' }).click()

      cy.wait('@projects')
      cy.wait('@projects')

      cy.wait('@projects').then(interception => {
        const searchParams = new URL(interception.request.url).searchParams

        expect(searchParams.get('withInvoiceData')).to.eq('true')
        expect(searchParams.get('cashed')).to.eq('true')
        expect(searchParams.get('started')).to.eq('true')
        expect(searchParams.get('ended')).to.eq('true')
      })
    })
  })

  describe('Project creation', () => {
    beforeEach(() => {
      cy.mockOpenSessionsCall()
      cy.mockApiConnection(`/clients`, 'clients', 'businessName').as('clients')
      cy.visit('/projects/new')
    })

    it('should be able to create a project', () => {
      const data = project

      cy.mockApiCall('POST', '/projects', project).as('createProject')
      cy.mockProjectCalls()

      cy.findByRole('heading', { name: 'New Project' }).should('be.visible')
      cy.findByRole('textbox', { name: 'Name' }).type(data.name)
      cy.findByRole('textbox', { name: 'Description' }).type(data.description)
      cy.findByRole('textbox', { name: 'Client' }).click()
      cy.findByRole('listitem', { name: 'Client 1' }).click()

      cy.setCalendar(
        cy.findByRole('textbox', { name: 'Starting date' }),
        new Date(project.startTime)
      )

      cy.setCalendar(
        cy.findByRole('textbox', { name: 'Ending date' }),
        new Date(project.endTime)
      )

      cy.findByRole('textbox', { name: 'Expected budget' }).type(
        data.expectedBudget.toString(10)
      )

      cy.findByLabelText('Invoice data').click({ force: true })
      cy.findByRole('textbox', { name: 'Invoice number' }).type(
        data.invoiceData.number
      )

      cy.setCalendar(
        cy.findByRole('textbox', { name: 'Invoice date' }),
        new Date(project.invoiceData.date)
      )

      cy.findByLabelText('Cashed').click({ force: true })

      cy.findByRole('textbox', { name: 'Cashed balance' }).type(
        data.cashData.amount.toString(10)
      )

      cy.setCalendar(
        cy.findByRole('textbox', { name: 'Cashed on' }),
        new Date(project.cashData.at)
      )

      cy.mockProjectCalls()

      cy.findByRole('button', { name: 'Submit' }).click()

      cy.wait('@createProject')
      cy.wait('@getProject')
      cy.wait('@getPreviousProject')
      cy.wait('@getNextProject')
      cy.wait('@getProjectTasks')
      cy.wait('@getTaxes')

      cy.url().should(
        'eq',
        Cypress.config().baseUrl + `/projects/${data._id.$oid}`
      )
    })
  })

  describe('Edit project', () => {
    beforeEach(() => {
      cy.mockOpenSessionsCall()
      cy.mockProjectCalls()
      cy.visit(`/projects/${project._id.$oid}`)
      cy.wait('@getProject')
      cy.wait('@getPreviousProject')
      cy.wait('@getNextProject')
      cy.wait('@getProjectTasks')
      cy.wait('@getTaxes')
    })

    it('should allow to edit a project', () => {
      const data = project

      cy.mockApiCall('PUT', `/projects/${project._id.$oid}`, 'project').as(
        'updateProject'
      )

      cy.findByRole('heading', { name: project.name }).should('be.visible')
      cy.findByRole('button', { name: 'Edit' }).click()
      cy.findByRole('textbox', { name: 'Name' }).clear().type(data.name)
      cy.findByRole('textbox', { name: 'Description' })
        .clear()
        .type(data.description)
      cy.findByRole('textbox', { name: 'Client' }).click()
      cy.findByRole('listitem', { name: 'Client 1' }).click()

      cy.setCalendar(
        cy.findByRole('textbox', { name: 'Starting date' }),
        new Date(data.startTime)
      )

      cy.setCalendar(
        cy.findByRole('textbox', { name: 'Ending date' }),
        new Date(data.endTime)
      )

      cy.findByRole('textbox', { name: 'Expected budget' })
        .clear()
        .type(data.expectedBudget.toString(10))

      cy.findByRole('textbox', { name: 'Invoice number' })
        .clear()
        .type(data.invoiceData.number)

      cy.setCalendar(
        cy.findByRole('textbox', { name: 'Invoice date' }),
        new Date(data.invoiceData.date)
      )

      cy.findByRole('textbox', { name: 'Cashed balance' })
        .clear()
        .type(data.cashData.amount.toString(10))

      cy.setCalendar(
        cy.findByRole('textbox', { name: 'Cashed on' }),
        new Date(data.cashData.at)
      )

      cy.findByRole('button', { name: 'Submit' }).click()
      cy.wait('@updateProject')
      cy.findByRole('heading', {
        name: `${data.name}`
      }).should('be.visible')
    })

    it('should allow to delete a project', () => {
      cy.mockApiConnection(`/projects`, 'projects', 'name').as('projects')
      cy.mockApiCall('DELETE', `/projects/${project._id.$oid}`, 'project').as(
        'deleteProject'
      )
      cy.findByRole('heading', { name: project.name }).should('be.visible')
      cy.findByRole('button', { name: 'Delete project' }).click()
      cy.findByRole('button', { name: 'Confirm' }).click()
      cy.wait('@deleteProject')
      cy.wait('@projects')
      cy.wait('@projects')
      cy.url().should('eq', Cypress.config().baseUrl + '/projects/all')
    })
  })
})
