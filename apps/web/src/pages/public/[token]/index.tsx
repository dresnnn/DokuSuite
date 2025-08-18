import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { apiClient } from '../../../../lib/api'
import {
  ExportJob,
  loadExportJobs,
  saveExportJobs,
  deleteExportJob,
} from '../../../../lib/exportJobs'
import { useToast } from '../../../components/Toast'

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
  const [notFound, setNotFound] = useState(false)
  const toastShown = useRef(false)
  const { showToast } = useToast()

  const client = apiClient as unknown as {
    GET: typeof apiClient.GET
    POST: typeof apiClient.POST
  }

  const handleNotFound = () => {
    if (!toastShown.current) {
      showToast('error', 'Freigabe nicht gefunden')
      toastShown.current = true
    }
    setNotFound(true)
  }

  useEffect(() => {
    const load = async () => {
      if (!token || Array.isArray(token) || notFound) return
      const { data, error } = await apiClient.GET('/public/shares/{token}', {
        params: { path: { token } },
      })
      if (error?.status === 404) {
        handleNotFound()
        return
      }
      setDownloadAllowed(data?.download_allowed !== false)
    }
    load()
  }, [token, notFound])

  useEffect(() => {
    const load = async () => {
      if (!token || Array.isArray(token) || notFound) return
      const { data, error } = await apiClient.GET(
        '/public/shares/{token}/photos',
        {
          params: { path: { token } },
        },
      )
      if (error?.status === 404) {
        handleNotFound()
        return
      }
      setPhotos((data?.items as Photo[]) || [])
    }
    load()
  }, [token, notFound])

  const toggleSelect = (id: number) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }

  const exportZip = async () => {
    if (selected.length === 0) return
    try {
      const { data, error } = await client.POST('/exports/zip', {
        body: {
          photoIds: selected.map(String),
          title: title || undefined,
          includeExif,
        },
      })
      if (error) throw error
      if (data) {
        setJobs((prev) => [...prev, data as ExportJob])
        showToast('success', 'Export gestartet')
      }
    } catch {
      showToast('error', 'Export fehlgeschlagen')
    }
  }

  const exportExcel = async () => {
    if (selected.length === 0) return
    try {
      const { data, error } = await client.POST('/exports/excel', {
        body: { photoIds: selected.map(String) },
      })
      if (error) throw error
      if (data) {
        setJobs((prev) => [...prev, data as ExportJob])
        showToast('success', 'Export gestartet')
      }
    } catch {
      showToast('error', 'Export fehlgeschlagen')
    }
  }

  const exportPdf = async () => {
    if (selected.length === 0) return
    try {
      const { data, error } = await client.POST('/exports/pdf', {
        body: { photoIds: selected.map(String) },
      })
      if (error) throw error
      if (data) {
        setJobs((prev) => [...prev, data as ExportJob])
        showToast('success', 'Export gestartet')
      }
    } catch {
      showToast('error', 'Export fehlgeschlagen')
    }
  }

  useEffect(() => {
    if (!token || Array.isArray(token)) return
    setJobs(loadExportJobs(token))
  }, [token])

  useEffect(() => {
    if (!token || Array.isArray(token)) return
    saveExportJobs(jobs, token)
  }, [jobs, token])

  useEffect(() => {
    const pending = jobs.filter(
      (j) => j.status !== 'done' && j.status !== 'error',
    )
    if (pending.length === 0) return

    const interval = setInterval(async () => {
      for (const job of pending) {
        if (!job.id) continue
        try {
          const { data } = await client.GET('/exports/{id}', {
            params: { path: { id: job.id } },
          })
          if (data) {
            setJobs((prev) =>
              prev.map((j) => (j.id === job.id ? (data as ExportJob) : j)),
            )
            if ((data as ExportJob).status === 'error') {
              showToast('error', 'Export fehlgeschlagen')
            }
          }
        } catch {
          showToast('error', 'Export fehlgeschlagen')
        }
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [jobs, client, showToast])

  const removeJob = (id?: string) => {
    if (!id || !token || Array.isArray(token)) return
    setJobs(deleteExportJob(id, token))
  }

  if (notFound) return <div>Freigabe nicht gefunden</div>

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
                <th>Remove</th>
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
                  <td>
                    <button onClick={() => removeJob(job.id)}>Remove</button>
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

