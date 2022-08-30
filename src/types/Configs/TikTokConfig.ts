type Cookie = {
  domain: string,
  expirationDate: number,
  hostOnly: boolean,
  httpOnly: boolean,
  name: string,
  path: string,
  sameSite: ('Strict' | 'Lax' | 'None'),
  secure: boolean,
  session: boolean,
  storeId: number,
  value: string,
  id: number
}

export type TikTokConfig = {
  username: string
  cookies: Cookie[]
};
