import { getDatabase } from './getDatabase'
import SQL from 'sql-template-strings'
import { queryToConnection, toCursor } from './queryToConnection'

describe('queryToConnection', () => {
  const data = [] as Array<{
    id: number
    char: string
    number: number
  }>

  beforeAll(async () => {
    const db = await getDatabase()

    await db.exec(`
      CREATE TABLE test (
        id INTEGER PRIMARY KEY,
        char TEXT NOT NULL,
        number INTEGER NOT NULL
      )
    `)

    const dataInput = [{
      char: 'A',
      number: 4
    }, {
      char: 'C',
      number: 3
    }, {
      char: 'B',
      number: 2
    }, {
      char: 'D',
      number: 1
    }]

    for (let i = 0; i < dataInput.length; i++) {
      const input = dataInput[i]
      const result = await db.run(SQL`
        INSERT INTO test (char, number) VALUES (${input.char}, ${input.number})
      `)

      data.push({ ...input, id: result.lastID as number })
    }

    expect(data).toEqual([
      { id: 1, char: 'A', number: 4 },
      { id: 2, char: 'C', number: 3 },
      { id: 3, char: 'B', number: 2 },
      { id: 4, char: 'D', number: 1 }
    ])
  })

  it('should work', async () => {
    const result = await queryToConnection({}, ['id', 'char', 'number'], 'test')

    expect(result.totalCount).toBe(4)
    expect(result.edges.length).toBe(4)
    expect(result.edges.map(edge => edge.node)).toEqual(data)

    const startCursor = result.edges[0].cursor
    const endCursor = result.edges[3].cursor

    expect(result.pageInfo.startCursor).toBe(startCursor)
    expect(result.pageInfo.endCursor).toBe(endCursor)
    expect(result.pageInfo.hasNextPage).toBe(false)
    expect(result.pageInfo.hasPreviousPage).toBe(false)
  })

  it('should handle "first" and "after" (one per page)', async () => {
    const result = await queryToConnection({
      first: 2, after: toCursor(3)
    }, ['id', 'char', 'number'], 'test', 'number ASC')

    expect(result.totalCount).toBe(4)
    expect(result.edges.length).toBe(2)
    expect(result.edges.map(edge => edge.node)).toEqual([data[1], data[0]])

    expect(result.pageInfo.startCursor).toBe(toCursor(4))
    expect(result.pageInfo.endCursor).toBe(toCursor(1))
    expect(result.pageInfo.hasNextPage).toBe(false)
    expect(result.pageInfo.hasPreviousPage).toBe(true)
  })

  it('should handle "first" and "after" (two per page)', async () => {

    const result = await queryToConnection({
      first: 1, after: toCursor(3)
    }, ['id', 'char', 'number'], 'test', 'number ASC')

    expect(result.totalCount).toBe(4)
    expect(result.edges.length).toBe(1)
    expect(result.edges.map(edge => edge.node)).toEqual([data[1]])

    expect(result.pageInfo.startCursor).toBe(toCursor(4))
    expect(result.pageInfo.endCursor).toBe(toCursor(1))
    expect(result.pageInfo.hasNextPage).toBe(true)
    expect(result.pageInfo.hasPreviousPage).toBe(true)
  })

  it('should handle "last" and "before" (one per page)', async () => {
    const result = await queryToConnection({
      last: 1, before: toCursor(2)
    }, ['id', 'char', 'number'], 'test', 'char ASC', SQL`WHERE char != ${'D'}`)

    expect(result.totalCount).toBe(3)
    expect(result.edges.length).toBe(1)
    expect(result.edges.map(edge => edge.node)).toEqual([data[2]])

    expect(result.pageInfo.startCursor).toBe(toCursor(1))
    expect(result.pageInfo.endCursor).toBe(toCursor(2))
    expect(result.pageInfo.hasNextPage).toBe(true)
    expect(result.pageInfo.hasPreviousPage).toBe(true)
  })

  it('should handle "last" and "before" (two per page)', async () => {
    const result = await queryToConnection({
      last: 2, before: toCursor(2)
    }, ['id', 'char', 'number'], 'test', 'char ASC', SQL`WHERE char != ${'D'}`)

    expect(result.totalCount).toBe(3)
    expect(result.edges.length).toBe(2)
    expect(result.edges.map(edge => edge.node)).toEqual([data[0], data[2]])

    expect(result.pageInfo.startCursor).toBe(toCursor(1))
    expect(result.pageInfo.endCursor).toBe(toCursor(2))
    expect(result.pageInfo.hasNextPage).toBe(true)
    expect(result.pageInfo.hasPreviousPage).toBe(false)
  })

  it('should handle empty results', async () => {
    const result = await queryToConnection(
      {},
      ['id', 'char', 'number'],
      'test',
      undefined,
      SQL`WHERE char = ${'Z'}`
    )

    expect(result.totalCount).toBe(0)
    expect(result.edges.length).toBe(0)
    expect(result.pageInfo.startCursor).toBe('')
    expect(result.pageInfo.endCursor).toBe('')
    expect(result.pageInfo.hasNextPage).toBe(false)
    expect(result.pageInfo.hasPreviousPage).toBe(false)
  })
})
