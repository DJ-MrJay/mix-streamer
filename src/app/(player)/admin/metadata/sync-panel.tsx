'use client'

import { useActionState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  CloudDownload,
  FolderPlus,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import {
  type DriveImportActionState,
  type MetadataSyncActionState,
  runDriveFolderImportAction,
  runMetadataBatchSyncAction,
} from './actions'
import SubmitButton from './submit-button'

const initialDriveImportActionState: DriveImportActionState = {
  status: 'idle',
  message: null,
  summary: null,
  importedMixes: [],
  metadataFailures: [],
}

const initialMetadataSyncActionState: MetadataSyncActionState = {
  status: 'idle',
  message: null,
  summary: null,
  failures: [],
}

const statusStyles = {
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  success: 'border-border bg-background/50 text-foreground',
} as const

export default function MetadataSyncPanel({
  defaultFolderId,
}: {
  defaultFolderId: string
}) {
  const [importState, importFormAction] = useActionState(
    runDriveFolderImportAction,
    initialDriveImportActionState
  )
  const [metadataState, metadataFormAction] = useActionState(
    runMetadataBatchSyncAction,
    initialMetadataSyncActionState
  )

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-border bg-card/80 shadow-[0_24px_48px_rgba(0,0,0,0.18)] backdrop-blur-sm">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            <ShieldCheck className="size-4" />
            <span>Admin</span>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold tracking-tight text-foreground">
              Drive library importer
            </CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Import brand-new audio files from your Google Drive folder into
              Supabase, skip rows that already exist by <code>drive_file_id</code>,
              and optionally sync metadata for the new rows immediately.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
          <div className="rounded-2xl bg-background/50 p-4">
            <p className="font-medium text-foreground">Primary workflow</p>
            <p className="mt-1">
              Import missing Drive files into <code>public.mixes</code>.
            </p>
          </div>

          <div className="rounded-2xl bg-background/50 p-4">
            <p className="font-medium text-foreground">Duplicate safety</p>
            <p className="mt-1">
              Existing rows are skipped by Drive file ID to avoid duplicate imports.
            </p>
          </div>

          <div className="rounded-2xl bg-background/50 p-4">
            <p className="font-medium text-foreground">Metadata follow-up</p>
            <p className="mt-1">
              Run embedded metadata sync during import or later as a separate backfill.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,1fr)]">
        <Card className="rounded-3xl border-border bg-card/80 shadow-[0_24px_48px_rgba(0,0,0,0.18)] backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FolderPlus className="size-4 text-primary" />
              <span>Import new Drive mixes</span>
            </div>
            <CardDescription className="text-sm text-muted-foreground">
              Leave the folder field as-is to use the configured default. Turn
              off publishing if you want rows staged in Supabase first.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form action={importFormAction} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">
                    Admin token
                  </span>
                  <Input
                    type="password"
                    name="token"
                    placeholder="Enter MIX_METADATA_SYNC_TOKEN"
                    autoComplete="current-password"
                    required
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">
                    Drive folder ID
                  </span>
                  <Input
                    type="text"
                    name="folderId"
                    defaultValue={defaultFolderId}
                    placeholder="Defaults to GOOGLE_DRIVE_AUDIO_FOLDER_ID"
                  />
                </label>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 rounded-2xl border border-border bg-background/40 px-4 py-3 text-sm text-foreground">
                  <input
                    type="checkbox"
                    name="publishImported"
                    defaultChecked
                    className="size-4 rounded border-input bg-background"
                  />
                  <span>Publish imported mixes immediately</span>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-border bg-background/40 px-4 py-3 text-sm text-foreground">
                  <input
                    type="checkbox"
                    name="syncMetadata"
                    defaultChecked
                    className="size-4 rounded border-input bg-background"
                  />
                  <span>Run metadata sync for newly imported rows</span>
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <SubmitButton
                  idleText="Import from Drive"
                  pendingText="Importing from Drive..."
                />
                <Button type="reset" variant="outline" className="w-full sm:w-auto">
                  Reset form
                </Button>
              </div>
            </form>

            {importState.message ? (
              <div
                className={`mt-5 rounded-2xl border px-4 py-4 text-sm ${
                  importState.status === 'error'
                    ? statusStyles.error
                    : statusStyles.success
                }`}
              >
                <div className="flex items-start gap-3">
                  {importState.status === 'error' ? (
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  )}

                  <div className="min-w-0 flex-1 space-y-3">
                    <p>{importState.message}</p>

                    {importState.summary ? (
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="rounded-2xl bg-background/60 px-3 py-2">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Folder
                          </p>
                          <p className="mt-1 truncate text-sm text-foreground">
                            {importState.summary.folderId}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-background/60 px-3 py-2">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Files checked
                          </p>
                          <p className="mt-1 text-sm text-foreground">
                            {importState.summary.scannedFiles}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-background/60 px-3 py-2">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Audio files
                          </p>
                          <p className="mt-1 text-sm text-foreground">
                            {importState.summary.supportedAudioFiles}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-background/60 px-3 py-2">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Inserted
                          </p>
                          <p className="mt-1 text-sm text-foreground">
                            {importState.summary.inserted}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-background/60 px-3 py-2">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Skipped existing
                          </p>
                          <p className="mt-1 text-sm text-foreground">
                            {importState.summary.skippedExisting}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-background/60 px-3 py-2">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                            Metadata synced
                          </p>
                          <p className="mt-1 text-sm text-foreground">
                            {importState.summary.metadataSynced}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {importState.importedMixes.length ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                          Imported rows
                        </p>

                        <div className="grid gap-2 sm:grid-cols-2">
                          {importState.importedMixes.map((mix) => (
                            <div
                              key={mix.id}
                              className="rounded-2xl bg-background/60 px-3 py-2 text-sm text-foreground"
                            >
                              <p className="font-medium">{mix.title}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {mix.slug ? `/mix/${mix.slug}` : 'No slug'}
                                {mix.metadataStatus
                                  ? ` | ${mix.metadataStatus}`
                                  : ''}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {importState.metadataFailures.length ? (
                      <div className="space-y-2 text-xs leading-relaxed text-muted-foreground">
                        <p className="font-medium uppercase tracking-[0.2em]">
                          Metadata sync issues
                        </p>

                        {importState.metadataFailures.slice(0, 5).map((failure) => (
                          <p key={failure.mixId}>
                            {failure.title}: {failure.error ?? 'Unknown error'}
                          </p>
                        ))}

                        {importState.metadataFailures.length > 5 ? (
                          <p>
                            Showing 5 of {importState.metadataFailures.length} failed
                            metadata sync results.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border-border bg-card/80 shadow-[0_24px_48px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <RefreshCw className="size-4 text-primary" />
                <span>Metadata backfill</span>
              </div>
              <CardDescription className="text-sm text-muted-foreground">
                Repair or refresh embedded metadata for mixes already in Supabase.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form action={metadataFormAction} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-foreground">
                      Admin token
                    </span>
                    <Input
                      type="password"
                      name="token"
                      placeholder="Enter MIX_METADATA_SYNC_TOKEN"
                      autoComplete="current-password"
                      required
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="text-sm font-medium text-foreground">
                      Batch size
                    </span>
                    <Input
                      type="number"
                      name="limit"
                      min="1"
                      max="100"
                      defaultValue="25"
                      required
                    />
                  </label>
                </div>

                <label className="flex items-center gap-3 rounded-2xl border border-border bg-background/40 px-4 py-3 text-sm text-foreground">
                  <input
                    type="checkbox"
                    name="publishedOnly"
                    defaultChecked
                    className="size-4 rounded border-input bg-background"
                  />
                  <span>Only sync published mixes</span>
                </label>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <SubmitButton
                    idleText="Run metadata sync"
                    pendingText="Running metadata sync..."
                  />
                  <Button
                    type="reset"
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    Reset form
                  </Button>
                </div>
              </form>

              {metadataState.message ? (
                <div
                  className={`mt-5 rounded-2xl border px-4 py-4 text-sm ${
                    metadataState.status === 'error'
                      ? statusStyles.error
                      : statusStyles.success
                  }`}
                >
                  <p>{metadataState.message}</p>

                  {metadataState.summary ? (
                    <p className="mt-2 text-muted-foreground">
                      Requested: {metadataState.summary.requested} | Succeeded:{' '}
                      {metadataState.summary.succeeded} | Failed:{' '}
                      {metadataState.summary.failed}
                    </p>
                  ) : null}

                  {metadataState.failures.length ? (
                    <div className="mt-3 space-y-1 text-xs leading-relaxed text-muted-foreground">
                      {metadataState.failures.slice(0, 5).map((failure) => (
                        <p key={failure.mixId}>
                          {failure.mixId}: {failure.error ?? 'Unknown error'}
                        </p>
                      ))}

                      {metadataState.failures.length > 5 ? (
                        <p>
                          Showing 5 of {metadataState.failures.length} failed mixes.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border bg-card/80 shadow-[0_24px_48px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CloudDownload className="size-4 text-primary" />
                <span>Importer behavior</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                The importer scans the configured Drive folder, filters to supported
                audio files, and skips any row whose <code>drive_file_id</code> already
                exists in Supabase.
              </p>

              <p>
                New rows get a generated slug immediately so they can link into the
                existing detail-page and player flow without manual cleanup.
              </p>

              <p>
                If you enable metadata sync, the importer also parses embedded tags
                and cover art for the newly inserted rows in the same run.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
