import { getDefaultAudioDriveFolderId } from '@/lib/drive-folder-import'

import MetadataSyncPanel from './sync-panel'

export const dynamic = 'force-dynamic'

export default function MetadataAdminPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
      <MetadataSyncPanel defaultFolderId={getDefaultAudioDriveFolderId()} />
    </div>
  )
}
