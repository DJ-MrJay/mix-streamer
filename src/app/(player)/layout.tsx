export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-dvh">
      <main className="flex-1 overflow-y-auto">{children}</main>

      {/* Player bar goes here */}
      {/* Bottom nav goes here */}
    </div>
  );
}
