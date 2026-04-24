import { google } from 'googleapis'

const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  undefined,
  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/drive.readonly']
)

export const drive = google.drive({
  version: 'v3',
  auth,
})