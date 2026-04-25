import PlayerBar from '@/components/player/player-bar'

export default function PlayerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <main className="flex-1 pb-24">
        {children}
        <PlayerBar />
      </main>
    </div>
  )
}
