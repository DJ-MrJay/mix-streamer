'use client'

import { useFormStatus } from 'react-dom'

import { Button } from '@/components/ui/button'

export default function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full sm:w-auto"
    >
      {pending ? 'Running metadata sync...' : 'Run Batch Sync'}
    </Button>
  )
}
