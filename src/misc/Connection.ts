interface Edge<T> {
  node: T
  cursor: string
}

export interface Connection<T> {
  totalCount: number
  edges: Edge<T>[]
  pageInfo: {
    startCursor: string
    endCursor: string
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}
