/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { apiClient } from '../../../lib/api'
import { undoStack } from '../../lib/undoStack'
import PhotoMap from '../../components/PhotoMap'
import PhotoUpload from '../../components/PhotoUpload'

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
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [siteId, setSiteId] = useState('')
  const [orderId, setOrderId] = useState('')
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [assignOrder, setAssignOrder] = useState('')
  const [assignWeek, setAssignWeek] = useState('')
  const [view, setView] = useState<'table' | 'grid' | 'map'>('table')

  const fetchPhotos = async (page = meta.page, limit = meta.limit) => {
    const { data } = await apiClient.GET('/photos', {
      params: {
        query: {
          page,
          limit,
          mode: mode || undefined,
          uploaderId: uploaderId || undefined,
          from: from || undefined,
          to: to || undefined,
          siteId: siteId || undefined,
          orderId: orderId || undefined,
          status: status || undefined,
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

  const toggleSelect = (id: number) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const assignSelected = async () => {
    if (!assignOrder || selected.length === 0) return
    const photoIds = selected.map(String)
    await apiClient.POST('/photos/batch/assign', {
      body: {
        photoIds,
        orderId: assignOrder,
        calendarWeek: assignWeek || undefined,
      },
    })
    undoStack.push(() =>
      apiClient.POST('/photos/batch/assign', {
        body: { photoIds, orderId: '' },
      }),
    )
    setSelected([])
    setAssignOrder('')
    setAssignWeek('')
  }

  const hideSelected = async () => {
    if (selected.length === 0) return
    const photoIds = selected.map(String)
    await apiClient.POST('/photos/batch/hide', {
      body: { photoIds },
    })
    setSelected([])
  }

  const curateSelected = async () => {
    if (selected.length === 0) return
    const photoIds = selected.map(String)
    await apiClient.POST('/photos/batch/curate', {
      body: { photoIds },
    })
    setSelected([])
  }

  const rematchSelected = async () => {
    if (selected.length === 0) return
    const photoIds = selected.map(String)
    await apiClient.POST('/photos/batch/rematch', {
      body: { photoIds },
    })
    setSelected([])
  }

  const changePage = (newPage: number) => {
    setMeta((m) => ({ ...m, page: newPage }))
    fetchPhotos(newPage)
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        if (meta.page! < totalPages) changePage((meta.page || 1) + 1)
      } else if (e.key === 'ArrowLeft') {
        if (meta.page! > 1) changePage((meta.page || 1) - 1)
      } else if (e.key.toLowerCase() === 'a') {
        setSelected((prev) =>
          prev.length === photos.length ? [] : photos.map((p) => p.id!),
        )
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        undoStack.undo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [meta, totalPages, photos])

  return (
    <div>
        <PhotoUpload onUploaded={fetchPhotos} />
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
        <label>
          From:
          <input
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          To:
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <label>
          Site ID:
          <input value={siteId} onChange={(e) => setSiteId(e.target.value)} />
        </label>
        <label>
          Order ID:
          <input value={orderId} onChange={(e) => setOrderId(e.target.value)} />
        </label>
        <label>
          Status:
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Any</option>
            <option value="INGESTED">INGESTED</option>
            <option value="PROCESSED">PROCESSED</option>
            <option value="REVIEWED">REVIEWED</option>
            <option value="SHARED">SHARED</option>
          </select>
        </label>
        <button type="submit">Fetch</button>
      </form>

      <div>
        <button onClick={() => setView('table')}>Table</button>
        <button onClick={() => setView('grid')}>Grid</button>
        <button onClick={() => setView('map')}>Map</button>
      </div>

      {view === 'table' ? (
        <table>
          <thead>
            <tr>
              <th></th>
              <th>ID</th>
              <th>Mode</th>
              <th>Uploader</th>
            </tr>
          </thead>
          <tbody>
            {photos.map((p) => (
              <tr key={p.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id!)}
                    onChange={() => toggleSelect(p.id!)}
                  />
                </td>
                <td>Photo {p.id}</td>
                <td>{p.mode}</td>
                <td>{p.uploader_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : view === 'grid' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
          }}
        >
          {photos.map((p) => (
            <label
              key={p.id}
              data-testid="photo"
              style={{ border: '1px solid #ccc', padding: '4px' }}
            >
              <input
                type="checkbox"
                checked={selected.includes(p.id!)}
                onChange={() => toggleSelect(p.id!)}
              />
              Photo {p.id}
            </label>
          ))}
        </div>
      ) : (
        <PhotoMap />
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

      <div style={{ marginTop: '1rem' }}>
        <h3>Assign Selected</h3>
        <div>Selected: {selected.length}</div>
        <label>
          Order ID:
          <input
            value={assignOrder}
            onChange={(e) => setAssignOrder(e.target.value)}
          />
        </label>
        <label>
          Calendar Week:
          <input
            value={assignWeek}
            onChange={(e) => setAssignWeek(e.target.value)}
          />
        </label>
        <button onClick={assignSelected}>Assign</button>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <h3>Batch Actions</h3>
        <div>Selected: {selected.length}</div>
        <button onClick={hideSelected}>Hide</button>
        <button onClick={curateSelected}>Curate</button>
        <button onClick={rematchSelected}>Rematch</button>
      </div>
    </div>
  )
}
