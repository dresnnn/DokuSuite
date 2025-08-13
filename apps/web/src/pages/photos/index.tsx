/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { apiClient } from '../../../lib/api'

type Photo = {
  id?: number
  mode?: string
  uploader_id?: string | null
}

type PageMeta = {
  page?: number
  limit?: number
  total?: number
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [meta, setMeta] = useState<PageMeta>({ page: 1, limit: 10, total: 0 })
  const [mode, setMode] = useState('')
  const [uploaderId, setUploaderId] = useState('')
  const [view, setView] = useState<'table' | 'grid'>('table')

  const fetchPhotos = async (page = meta.page, limit = meta.limit) => {
    const { data } = await apiClient.GET('/photos', {
      params: {
        query: {
          page,
          limit,
          mode: mode || undefined,
          uploaderId: uploaderId || undefined,
        },
      },
    })
    if (data) {
      setPhotos(data.items || [])
      setMeta(data.meta || { page: page, limit: limit, total: 0 })
    }
  }

  useEffect(() => {
    fetchPhotos()
  }, [])

  const totalPages = Math.ceil((meta.total || 0) / (meta.limit || 1)) || 1

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPhotos()
  }

  const changePage = (newPage: number) => {
    setMeta((m) => ({ ...m, page: newPage }))
    fetchPhotos(newPage)
  }

  return (
    <div>
      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <label>
          Page:
          <input
            type="number"
            value={meta.page}
            onChange={(e) =>
              setMeta((m) => ({ ...m, page: Number(e.target.value) }))
            }
          />
        </label>
        <label>
          Limit:
          <input
            type="number"
            value={meta.limit}
            onChange={(e) =>
              setMeta((m) => ({ ...m, limit: Number(e.target.value) }))
            }
          />
        </label>
        <label>
          Mode:
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="">Any</option>
            <option value="FIXED_SITE">FIXED_SITE</option>
            <option value="MOBILE">MOBILE</option>
          </select>
        </label>
        <label>
          Uploader ID:
          <input
            value={uploaderId}
            onChange={(e) => setUploaderId(e.target.value)}
          />
        </label>
        <button type="submit">Fetch</button>
      </form>

      <button onClick={() => setView(view === 'table' ? 'grid' : 'table')}>
        Toggle {view === 'table' ? 'Grid' : 'Table'}
      </button>

      {view === 'table' ? (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Mode</th>
              <th>Uploader</th>
            </tr>
          </thead>
          <tbody>
            {photos.map((p) => (
              <tr key={p.id}>
                <td>Photo {p.id}</td>
                <td>{p.mode}</td>
                <td>{p.uploader_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
          }}
        >
          {photos.map((p) => (
            <div key={p.id} data-testid="photo">
              Photo {p.id}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        <button
          disabled={meta.page === 1}
          onClick={() => changePage((meta.page || 1) - 1)}
        >
          Prev
        </button>
        <span>
          {meta.page} / {totalPages}
        </span>
        <button
          disabled={meta.page === totalPages}
          onClick={() => changePage((meta.page || 1) + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
