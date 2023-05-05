export interface GetServerResourcesResponse {
  cpu: {
    threads: number
    model: string
    usage: number
  }
  memory: {
    total: number
    usage: number
  }
}