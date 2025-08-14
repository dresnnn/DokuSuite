import { useEffect, useState } from 'react'
import { apiClient } from '../../../lib/api'
import { useToast } from '../../components/Toast'

type Location = {
  id?: number
  name?: string
  address?: string
  active?: boolean
}

type PageMeta = {
  page?: number
  limit?: number
  total?: number
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [meta, setMeta] = useState<PageMeta>({ page: 1, limit: 10, total: 0 })
  const [q, setQ] = useState('')
  const [near, setNear] = useState('')
  const [radius, setRadius] = useState(50)
  const { showToast } = useToast()

  const fetchLocations = async (page = meta.page, limit = meta.limit) => {
    try {
      const { data } = await apiClient.GET('/locations', {
        params: {
          query: {
            q: q || undefined,
            near: near || undefined,
            radius_m: radius || undefined,
            page,
            limit,
          },
        },
      })
      if (data) {
        setLocations(data.items || [])
        setMeta(data.meta || { page, limit, total: 0 })
      }
    } catch {
      showToast('error', 'Failed to load locations')
    }
  }

  useEffect(() => {
    fetchLocations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setMeta((m) => ({ ...m, page: 1 }))
    fetchLocations(1)
  }

  const changePage = (newPage: number) => {
    setMeta((m) => ({ ...m, page: newPage }))
    fetchLocations(newPage)
  }

  const handleFieldChange = (
    id: number,
    field: keyof Location,
    value: string | boolean,
  ) => {
    setLocations((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)),
    )
  }

  const handleSave = async (loc: Location) => {
    try {
      await apiClient.PATCH('/locations/{id}', {
        params: { path: { id: loc.id! } },
        body: {
          name: loc.name,
          address: loc.address,
          active: loc.active,
        },
      })
      showToast('success', 'Location updated')
    } catch {
      showToast('error', 'Failed to update location')
    }
  }

  const totalPages = Math.ceil((meta.total || 0) / (meta.limit || 1)) || 1

  return (
    <div>
      <form onSubmit={handleSearch} style={{ marginBottom: '1rem' }}>
        <input
          placeholder="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <input
          placeholder="near"
          value={near}
          onChange={(e) => setNear(e.target.value)}
        />
        <input
          type="number"
          placeholder="radius_m"
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
        />
        <button type="submit">Search</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((l) => (
            <tr key={l.id}>
              <td>
                <input
                  value={l.name || ''}
                  onChange={(e) =>
                    handleFieldChange(l.id!, 'name', e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  value={l.address || ''}
                  onChange={(e) =>
                    handleFieldChange(l.id!, 'address', e.target.value)
                  }
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={!!l.active}
                  onChange={(e) =>
                    handleFieldChange(l.id!, 'active', e.target.checked)
                  }
                />
              </td>
              <td>
                <button onClick={() => handleSave(l)}>Save</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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

