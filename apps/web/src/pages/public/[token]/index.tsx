import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { apiClient } from '../../../../lib/api'

type Photo = {
  id: number
  original_url?: string
  thumbnail_url?: string
}

export default function PublicSharePage() {
  const router = useRouter()
  const { token } = router.query
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selected, setSelected] = useState<number[]>([])

  useEffect(() => {
    const load = async () => {
      if (!token || Array.isArray(token)) return
      const list = await apiClient.GET('/public/shares/{token}/photos', {
        params: { path: { token } },
      })
      const items = list.data?.items || []
      const results: Photo[] = []
      for (const p of items) {
        const { data } = await apiClient.GET('/public/shares/{token}/photos/{id}', {
          params: { path: { token, id: p.id! } },
        })
        results.push({ id: p.id!, ...data })
      }
      setPhotos(results)
    }
    load()
  }, [token])

  const toggleSelect = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const exportZip = async () => {
    await apiClient.POST('/exports/zip', { body: { photoIds: selected.map(String) } })
  }

  const exportExcel = async () => {
    await apiClient.POST('/exports/excel', { body: { photoIds: selected.map(String) } })
  }

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginBottom: '1rem',
        }}
      >
        {photos.map((p) => (
          <label key={p.id} data-testid="photo" style={{ border: '1px solid #ccc', padding: '4px' }}>
            <input
              type="checkbox"
              checked={selected.includes(p.id)}
              onChange={() => toggleSelect(p.id)}
            />
            {p.thumbnail_url ? (
              <img src={p.thumbnail_url} alt={`Photo ${p.id}`} />
            ) : (
              <span>Photo {p.id}</span>
            )}
          </label>
        ))}
      </div>
      <div>
        <button onClick={exportZip}>Download ZIP</button>
        <button onClick={exportExcel}>Download Excel</button>
      </div>
    </div>
  )
}

