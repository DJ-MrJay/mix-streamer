type Mix = {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
}

export default function MixCard({ mix }: { mix: Mix }) {
  return (
    <div className="rounded-xl overflow-hidden border p-3">
      <div className="aspect-square bg-gray-200 rounded-lg mb-3" />
      <h3 className="font-medium">{mix.title}</h3>
      <p className="text-sm text-gray-500">{mix.description}</p>
    </div>
  )
}