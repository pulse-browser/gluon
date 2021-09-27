export interface IPatch {
  name: string
  action: 'copy' | 'delete'
  src: string | string[]
  markers?: {
    [key: string]: [string, string]
  }
  indent?: number
}
