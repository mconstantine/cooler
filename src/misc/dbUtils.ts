import { getDatabase } from './getDatabase'

/**
 * Inserts one or more rows into the database. Every key in `_rows` that has a value of
 * `undefined` will _not_ be inserted.
 * @param _tableName the table in which to insert the row(s)
 * @param _rows the row(s) to be inserted, as objects
 */
export async function insert<T extends { [key: string]: any }>(
  tableName: string, _rows: T | T[]
) {
  const db = await getDatabase()

  const removeUndefined = (rows: T) => Object.entries(rows).filter(
    ([, value]) => value !== undefined
  ).reduce(
    (res, [key, value]) => ({ ...res, [key]: value }), {}
  )

  const rows = (Array.isArray(_rows) ?
    _rows.map(row => removeUndefined(row)) :
    removeUndefined(_rows)) as T | T[]

  const columns = `\`${Object.keys(Array.isArray(rows) ? rows[0] : rows).join('`, `')}\``
  const values = `${
    (Array.isArray(rows) ? rows : [rows])
    .map(row => new Array(Object.keys(row).length).fill('?').join(', '))
    .join('), (')
  }`

  const query = `INSERT INTO ${tableName} (${columns}) VALUES (${values})`

  const args = Array.isArray(rows) ?
    rows.map(row => Object.values(row)).flat() :
    Object.values(rows)

  return await db.run(query, ...args)
}

export async function update<T extends { [key: string]: any }>(
  tableName: string, row: T, primaryKey = 'id'
) {
  const db = await getDatabase()

  // Magic reduce from { key: value } to [['key = ?'], [value]]
  const [query, args] = Object.entries(
    Object.entries(row)
    .filter(
      ([, value]) => value !== undefined
    ).reduce(
      (res, [key, value]) => ({ ...res, [key]: value }), {}
    )
  )
  .filter(([key]) => key !== primaryKey)
  .reduce(([query, args], [key, value]) => {
    return [[...query, `\`${key}\` = ?`], [...args, value]]
  }, [[], []] as [string[], any[]])

  return await db.run(
    `UPDATE ${tableName} SET ${query.join(', ')} WHERE \`${primaryKey}\` = ?`,
    ...args,
    row[primaryKey]
  )
}

export async function remove<T extends { [key: string]: any }>(
  tableName: string, where?: T
) {
  const db = await getDatabase()

  let query = `DELETE FROM ${tableName}`
  let args = [] as any[]

  if (where && Object.keys(where).length) {
    const whereStatement = Object.keys(where).map(key => `\`${key}\` = ?`).join(' AND ')
    query += ` WHERE ${whereStatement}`
    args = Object.values(where)
  }

  return await db.run(query, ...args)
}

export function toSQLDate(d: Date): string {
  const withLeadingZero = (n: number) => (n < 10 ? '0' : '') + n

  return [
    d.getUTCFullYear(),
    withLeadingZero(d.getUTCMonth() + 1),
    withLeadingZero(d.getUTCDate())
  ].join('-') + ' ' + [
    withLeadingZero(d.getUTCHours()),
    withLeadingZero(d.getUTCMinutes()),
    withLeadingZero(d.getUTCSeconds())
  ].join(':')
}
