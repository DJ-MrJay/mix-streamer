import 'server-only'

import { google } from 'googleapis'

let auth: InstanceType<typeof google.auth.GoogleAuth> | undefined
let drive: ReturnType<typeof google.drive> | undefined

const getRequiredEnv = (key: string) => {
  const value = process.env[key]

  if (!value?.trim()) {
    throw new Error(`${key} is not set`)
  }

  return value
}

const getGoogleAuth = () => {
  if (auth) {
    return auth
  }

  auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: getRequiredEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
      private_key: getRequiredEnv('GOOGLE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })

  return auth
}

export const getDrive = () => {
  if (drive) {
    return drive
  }

  drive = google.drive({
    version: 'v3',
    auth: getGoogleAuth(),
  })

  return drive
}

export const getDriveAccessToken = async () => {
  const client = await getGoogleAuth().getClient()
  const accessTokenResponse = await client.getAccessToken()
  const token =
    typeof accessTokenResponse === 'string'
      ? accessTokenResponse
      : accessTokenResponse?.token

  if (!token) {
    throw new Error('Unable to get a Google Drive access token')
  }

  return token
}
