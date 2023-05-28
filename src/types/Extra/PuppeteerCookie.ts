export interface PuppeteerCookie {
  name: string
  value: string
  domain: string
  path: string
  expires: number
  size: number
  httpOnly: boolean
  secure: boolean
  session: boolean
  sameSite?: ('Strict' | 'Lax' | 'None')
  priority: ('Low' | 'Medium' | 'High')
  sameParty: boolean
  sourceScheme: ('Unset' | 'NonSecure' | 'Secure')
  sourcePort: number
  partitionKey?: string
  partitionKeyOpaque?: boolean
}