import 'server-only'

import { google } from 'googleapis'

let drive: ReturnType<typeof google.drive> | undefined

const getRequiredEnv = (key: string) => {
  const value = process.env[key]

  if (!value?.trim()) {
    throw new Error(`${key} is not set`)
  }

  return value
}

export const getDrive = () => {
  if (drive) {
    return drive
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: getRequiredEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
      private_key: getRequiredEnv('GOOGLE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })

  drive = google.drive({
    version: 'v3',
    auth,
  })

  return drive
}
