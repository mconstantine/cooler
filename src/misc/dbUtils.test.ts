import { insert, update, remove } from './dbUtils'

interface FakeDatabase {
  run: jest.Mock
}

const testResult = 'testResult'
const mockDatabase: FakeDatabase = { run: jest.fn(() => testResult) }

jest.mock('./getDatabase', () => ({
  getDatabase: () => mockDatabase
}))

describe('dbUtils', () => {
  beforeEach(() => {
    mockDatabase.run.mockClear()
  })

  describe('insert', () => {
    it('should work', async () => {
      const data = {
        col1: 'value1',
        col2: 'value2'
      }

      const result = await insert('someTable', data)

      expect(result).toBe(testResult)
      expect(mockDatabase.run).toHaveBeenCalledWith(
        'INSERT INTO someTable (`col1`, `col2`) VALUES (?, ?)',
        'value1', 'value2'
      )
    })

    it('should handle multiple rows', async () => {
      const data = [{
        col1: 'value1',
        col2: 'value2'
      }, {
        col1: 'value3',
        col2: 'value4'
      }]

      const result = await insert('someTable', data)

      expect(result).toBe(testResult)
      expect(mockDatabase.run).toHaveBeenCalledWith(
        'INSERT INTO someTable (`col1`, `col2`) VALUES (?, ?), (?, ?)',
        'value1', 'value2', 'value3', 'value4'
      )
    })

    it('should remove keys of undefined values', async () => {
      const data = [{
        col1: 'value1',
        col2: undefined,
        col3: 'value3'
      }, {
        col1: 'value4',
        col2: undefined,
        col3: 'value6'
      }]

      const result = await insert('someTable', data)

      expect(result).toBe(testResult)
      expect(mockDatabase.run).toHaveBeenCalledWith(
        'INSERT INTO someTable (`col1`, `col3`) VALUES (?, ?), (?, ?)',
        'value1', 'value3', 'value4', 'value6'
      )
    })
  })

  describe('update', () => {
    it('should work', async () => {
      const data = {
        primary: 42,
        col1: 'value1',
        col2: 'value2'
      }

      const result = await update('someTable', data, 'primary')

      expect(result).toBe(testResult)
      expect(mockDatabase.run).toHaveBeenCalledWith(
        'UPDATE someTable SET `col1` = ?, `col2` = ? WHERE `primary` = ?',
        'value1', 'value2', 42
      )
    })

    it('should remove keys of undefined values', async () => {
      const data = {
        primary: 42,
        col1: 'value1',
        col2: undefined,
        col3: 'value3'
      }

      const result = await update('someTable', data, 'primary')

      expect(result).toBe(testResult)
      expect(mockDatabase.run).toHaveBeenCalledWith(
        'UPDATE someTable SET `col1` = ?, `col3` = ? WHERE `primary` = ?',
        'value1', 'value3', 42
      )
    })
  })

  describe('remove', () => {
    it('should work with no WHERE clause', async () => {
      const result = await remove('someTable')

      expect(result).toBe(testResult)
      expect(mockDatabase.run).toHaveBeenCalledWith('DELETE FROM someTable')
    })

    it('should work with WHERE clause', async () => {
      const data = { col1: 'value1' }
      const result = await remove('someTable', data)

      expect(result).toBe(testResult)
      expect(mockDatabase.run).toHaveBeenCalledWith(
        'DELETE FROM someTable WHERE `col1` = ?',
        'value1'
      )
    })

    it('should AND queries by default', async () => {
      const data = {
        col1: 'value1',
        col2: 'value2'
      }

      const result = await remove('someTable', data)

      expect(result).toBe(testResult)
      expect(mockDatabase.run).toHaveBeenCalledWith(
        'DELETE FROM someTable WHERE `col1` = ? AND `col2` = ?',
        'value1', 'value2'
      )
    })
  })
})
