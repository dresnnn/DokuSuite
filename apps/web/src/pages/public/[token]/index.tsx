import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { apiClient } from '../../../../lib/api'
import {
  ExportJob,
  loadExportJobs,
  saveExportJobs,
} from '../../../../lib/exportJobs'

const PhotoMap = dynamic(() => import('../../../components/PhotoMap'), {
  ssr: false,
})

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
  const [view, setView] = useState<'grid' | 'map'>('grid')
  const [jobs, setJobs] = useState<ExportJob[]>([])
  const [downloadAllowed, setDownloadAllowed] = useState(true)
  const [title, setTitle] = useState('')
  const [includeExif, setIncludeExif] = useState(false)

  const client = apiClient as unknown as {
    GET: typeof apiClient.GET
    POST: typeof apiClient.POST
  }

  useEffect(() => {
    const load = async () => {
      if (!token || Array.isArray(token)) return
      const { data } = await apiClient.GET('/public/shares/{token}', {
        params: { path: { token } },
      })
      setDownloadAllowed(data?.download_allowed !== false)
    }
    load()
  }, [token])

  useEffect(() => {
    const load = async () => {
      if (!token || Array.isArray(token)) return
      const list = await apiClient.GET('/public/shares/{token}/photos', {
        params: { path: { token } },
      })
      setPhotos((list.data?.items as Photo[]) || [])
    }
    load()
  }, [token])

  const toggleSelect = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const exportZip = async () => {
    if (selected.length === 0) return
    const { data } = await client.POST('/exports/zip', {
      body: {
        photoIds: selected.map(String),
        title: title || undefined,
        includeExif,
      },
    })
    if (data) setJobs((prev) => [...prev, data as ExportJob])
  }

  const exportExcel = async () => {
    if (selected.length === 0) return
    const { data } = await client.POST('/exports/excel', {
      body: { photoIds: selected.map(String) },
    })
    if (data) setJobs((prev) => [...prev, data as ExportJob])
  }

  const exportPdf = async () => {
    if (selected.length === 0) return
    const { data } = await client.POST('/exports/pdf', {
      body: { photoIds: selected.map(String) },
    })
    if (data) setJobs((prev) => [...prev, data as ExportJob])
  }

  useEffect(() => {
    setJobs(loadExportJobs())
  }, [])

  useEffect(() => {
    saveExportJobs(jobs)
  }, [jobs])

  useEffect(() => {
    const pending = jobs.filter((j) => j.status !== 'done')
    if (pending.length === 0) return

    const interval = setInterval(async () => {
      for (const job of pending) {
        if (!job.id) continue
        const { data } = await client.GET('/exports/{id}', {
          params: { path: { id: job.id } },
        })
        if (data)
          setJobs((prev) =>
            prev.map((j) => (j.id === job.id ? (data as ExportJob) : j)),
          )
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [jobs, client])

  return (
    <div>
      <div>
        <button onClick={() => setView('grid')}>Grid</button>
        <button onClick={() => setView('map')}>Map</button>
      </div>

      {view === 'grid' ? (
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
      ) : (
        typeof token === 'string' && <PhotoMap shareToken={token} />
      )}

      {downloadAllowed && (
        <div>
          <label>
            Title:
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            Include EXIF:
            <input
              type="checkbox"
              checked={includeExif}
              onChange={(e) => setIncludeExif(e.target.checked)}
            />
          </label>
          <button onClick={exportZip}>Download ZIP</button>
          <button onClick={exportExcel}>Download Excel</button>
          <button onClick={exportPdf}>Download PDF</button>
        </div>
      )}

      {jobs.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Export Jobs</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.id}</td>
                  <td>{job.status}</td>
                  <td>
                    {job.status === 'done' && job.url ? (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download
                      </a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

