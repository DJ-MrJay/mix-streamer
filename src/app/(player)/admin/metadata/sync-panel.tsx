'use client'

import { useActionState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import {
  type MetadataSyncActionState,
  runMetadataBatchSyncAction,
} from './actions'
import SubmitButton from './submit-button'

const initialMetadataSyncActionState: MetadataSyncActionState = {
  status: 'idle',
  message: null,
  summary: null,
  failures: [],
}

export default function MetadataSyncPanel() {
  const [state, formAction] = useActionState(
    runMetadataBatchSyncAction,
    initialMetadataSyncActionState
  )

  return (
    <section className="rounded-3xl border border-border bg-card/80 p-5 shadow-[0_24px_48px_rgba(0,0,0,0.18)] backdrop-blur-sm sm:p-6">
      <div className="mb-5 space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Admin
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Metadata Backfill
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Run the server-side ID3 sync for your latest mixes without calling the
          admin API manually.
        </p>
      </div>

      <form
        action={formAction}
        className="space-y-5"
      >
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
          <SubmitButton />
          <Button
            type="reset"
            variant="outline"
            className="w-full sm:w-auto"
          >
            Clear Form
          </Button>
        </div>
      </form>

      {state.message ? (
        <div
          className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
            state.status === 'error'
              ? 'border-destructive/30 bg-destructive/10 text-destructive'
              : 'border-border bg-background/50 text-foreground'
          }`}
        >
          <p>{state.message}</p>

          {state.summary ? (
            <p className="mt-2 text-muted-foreground">
              Requested: {state.summary.requested} | Succeeded:{' '}
              {state.summary.succeeded} | Failed: {state.summary.failed}
            </p>
          ) : null}

          {state.failures.length ? (
            <div className="mt-3 space-y-1 text-xs leading-relaxed text-muted-foreground">
              {state.failures.slice(0, 5).map((failure) => (
                <p key={failure.mixId}>
                  {failure.mixId}: {failure.error ?? 'Unknown error'}
                </p>
              ))}
              {state.failures.length > 5 ? (
                <p>Showing 5 of {state.failures.length} failed mixes.</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
