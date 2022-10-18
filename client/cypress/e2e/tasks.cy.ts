import project from '../fixtures/project.json'
import task from '../fixtures/task.json'

describe('Tasks pages', () => {
  beforeEach(() => {
    cy.skipLogin()
  })

  describe('Task details page', () => {
    it('should be reachable', () => {
      cy.mockOpenSessionsCall()
      cy.mockProjectCalls()
      cy.mockApiCall('GET', `/tasks/${task._id.$oid}`, 'task').as('task')

      cy.visit(`/projects/${project._id.$oid}`)

      cy.wait('@openSessions')
      cy.wait('@getProject')
      cy.wait('@getTaxes')
      cy.wait('@getPreviousProject')
      cy.wait('@getNextProject')
      cy.wait('@getProjectTasks')

      cy.mockTaskCalls()
      cy.findByLabelText(task.name).click()

      cy.url().should(
        'equal',
        Cypress.config().baseUrl +
          `/projects/${project._id.$oid}/tasks/${task._id.$oid}`
      )

      cy.wait('@sessions')
      cy.wait('@getPreviousTask')
      cy.wait('@getNextTask')
    })
  })

  describe('Task creation', () => {
    beforeEach(() => {
      cy.mockOpenSessionsCall()
      cy.mockProjectCalls()
      cy.visit(`/projects/${project._id.$oid}`)
      cy.wait('@openSessions')
      cy.wait('@getProject')
      cy.wait('@getTaxes')
      cy.wait('@getPreviousProject')
      cy.wait('@getNextProject')
      cy.wait('@getProjectTasks')
    })

    it('should be able to create a new task (not repeating)', () => {
      cy.findByRole('button', { name: 'New task' }).click()

      cy.findByRole('textbox', { name: 'Name' }).type(task.name)
      cy.findByRole('textbox', { name: 'Description' }).type(task.description)
      cy.findByRole('textbox', { name: 'Expected working hours' }).type(
        task.expectedWorkingHours.toString(10)
      )
      cy.findByRole('textbox', { name: 'Hourly cost' }).type(
        task.hourlyCost.toString(10)
      )
      cy.setCalendar(
        cy.findByRole('textbox', { name: 'Starting at' }),
        new Date(task.startTime)
      )

      cy.mockApiCall('POST', '/tasks', task).as('createTask')
      cy.mockApiCall('GET', `/tasks/${task._id.$oid}`, task).as('createTask')
      cy.mockTaskCalls()
      cy.findByRole('button', { name: 'Submit' }).click()

      cy.wait('@createTask')
      cy.wait('@sessions')
      cy.wait('@getPreviousTask')
      cy.wait('@getNextTask')

      cy.url().should(
        'equal',
        Cypress.config().baseUrl +
          `/projects/${project._id.$oid}/tasks/${task._id.$oid}`
      )
    })
  })
})
