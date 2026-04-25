// src/app/(player)/mix/[slug]/page.tsx

import { supabase } from '@/lib/supabase'

// 1. Make the component function async
export default async function MixPage({
  params,
}: {
  params: Promise<{ slug: string }> // 2. Type params as a Promise
}) {
  // 3. Await the params to get the slug
  const { slug } = await params

  const { data: mix } = await supabase
    .from('mixes')
    .select('*')
    .eq('slug', slug) // 4. Use the unwrapped slug variable
    .single()

  if (!mix) {
    return <div>Mix not found</div>
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Cover */}
      <img
        src={mix.cover_image_url}
        className="w-full max-h-[400px] object-cover rounded-xl mb-6"
      />

      {/* Title */}
      <h1 className="text-2xl font-bold mb-2">{mix.title}</h1>

      {/* Description */}
      {mix.description && (
        <p className="text-gray-400 mb-4">{mix.description}</p>
      )}

      
    </div>
  )
}