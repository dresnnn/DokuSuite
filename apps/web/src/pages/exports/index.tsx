import { useEffect, useState } from 'react'
import { apiClient } from '../../../lib/api'
import {
  ExportJob,
  loadExportJobs,
  saveExportJobs,
} from '../../../lib/exportJobs'

export default function ExportsPage() {
  const [jobs, setJobs] = useState<ExportJob[]>([])

  useEffect(() => {
    setJobs(loadExportJobs())
  }, [])

  useEffect(() => {
    saveExportJobs(jobs)
  }, [jobs])

  const client = apiClient as unknown as {
    GET: typeof apiClient.GET
    POST: typeof apiClient.POST
  }

  const triggerZipExport = async () => {
    const { data } = await client.POST('/exports/zip', {})
    if (data) setJobs((prev) => [...prev, data as ExportJob])
  }

  const triggerExcelExport = async () => {
    const { data } = await client.POST('/exports/excel', {})
    if (data) setJobs((prev) => [...prev, data as ExportJob])
  }

  const triggerPdfExport = async () => {
    const { data } = await client.POST('/exports/pdf', {})
    if (data) setJobs((prev) => [...prev, data as ExportJob])
  }

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
      <button onClick={triggerZipExport}>Start ZIP Export</button>
      <button onClick={triggerExcelExport}>Start Excel Export</button>
      <button onClick={triggerPdfExport}>Start PDF Export</button>
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
                  <a href={job.url} target="_blank" rel="noopener noreferrer">
                    Download
                  </a>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
