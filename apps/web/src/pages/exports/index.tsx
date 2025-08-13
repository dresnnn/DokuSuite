/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { apiClient } from '../../../lib/api'

type ExportJob = {
  id?: string
  status?: string
  url?: string
}

export default function ExportsPage() {
  const [jobs, setJobs] = useState<ExportJob[]>([])

  const client = apiClient as unknown as {
    GET: typeof apiClient.GET
    POST: typeof apiClient.POST
  }

  const fetchExports = async () => {
    const { data } = await client.GET('/exports')
    if (data) setJobs(data as ExportJob[])
  }

  useEffect(() => {
    fetchExports()
  }, [])

  const triggerExport = async () => {
    const { data } = await client.POST('/exports', {})
    if (data) setJobs((prev) => [...prev, data as ExportJob])
  }

  return (
    <div>
      <button onClick={triggerExport}>Start Export</button>
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
