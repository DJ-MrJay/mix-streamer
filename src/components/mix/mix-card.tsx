'use client'

import { usePlayer } from '@/hooks/use-player'

type Mix = {
  id: string
  title: string
  drive_file_id: string
}

export default function MixCard({ mix }: { mix: Mix }) {
  const setTrack = usePlayer((s) => s.setTrack)

  return (
    <div className="border p-3 rounded-xl">
      <h3 className="font-medium">{mix.title}</h3>

      <button
        className="text-sm mt-2"
        onClick={() =>
          setTrack({
            id: mix.id,
            title: mix.title,
            drive_file_id: mix.drive_file_id,
          })
        }
      >
        Play
      </button>
    </div>
  )
}