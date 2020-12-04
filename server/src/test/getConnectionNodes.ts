import { Connection } from '../misc/Connection'

export function getConnectionNodes<T>(connection: Connection<T>): T[] {
  return connection.edges.map(({ node }) => node)
}
