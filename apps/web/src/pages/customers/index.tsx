import { useEffect, useState } from 'react'
import { apiClient } from '../../../lib/api'

type Customer = {
  id?: number
  name?: string
  watermark_policy?: string | null
  watermark_text?: string | null
}

type PageMeta = {
  page?: number
  limit?: number
  total?: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [meta, setMeta] = useState<PageMeta>({ page: 1, limit: 10, total: 0 })
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    watermark_policy: 'none',
    watermark_text: '',
  })

  const fetchCustomers = async (page = meta.page, limit = meta.limit) => {
    const { data } = await apiClient.GET('/customers', {
      params: { query: { page, limit } },
    })
    if (data) {
      setCustomers(data.items || [])
      setMeta(data.meta || { page, limit, total: 0 })
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await apiClient.POST('/customers', {
      body: {
        name: newCustomer.name,
        watermark_policy: newCustomer.watermark_policy,
        watermark_text: newCustomer.watermark_text || undefined,
      },
    })
    setNewCustomer({ name: '', watermark_policy: 'none', watermark_text: '' })
    fetchCustomers()
  }

  const handleFieldChange = (
    index: number,
    field: keyof Customer,
    value: string,
  ) => {
    setCustomers((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [field]: value }
      return copy
    })
  }

  const handleUpdate = async (c: Customer) => {
    await apiClient.PATCH('/customers/{id}', {
      params: { path: { id: c.id! } },
      body: {
        name: c.name,
        watermark_policy: c.watermark_policy,
        watermark_text: c.watermark_text,
      },
    })
    fetchCustomers()
  }

  const handleDelete = async (id: number) => {
    await apiClient.DELETE('/customers/{id}', { params: { path: { id } } })
    setCustomers((prev) => prev.filter((c) => c.id !== id))
  }

  const totalPages = Math.ceil((meta.total || 0) / (meta.limit || 1)) || 1

  const changePage = (newPage: number) => {
    setMeta((m) => ({ ...m, page: newPage }))
    fetchCustomers(newPage)
  }

  const handleFetch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCustomers()
  }

  return (
    <div>
      <form onSubmit={handleFetch} style={{ marginBottom: '1rem' }}>
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
        <button type="submit">Fetch</button>
      </form>

      <form onSubmit={handleCreate} style={{ marginBottom: '1rem' }}>
        <input
          placeholder="Name"
          value={newCustomer.name}
          onChange={(e) =>
            setNewCustomer((c) => ({ ...c, name: e.target.value }))
          }
        />
        <select
          value={newCustomer.watermark_policy}
          onChange={(e) =>
            setNewCustomer((c) => ({
              ...c,
              watermark_policy: e.target.value,
            }))
          }
        >
          <option value="none">none</option>
          <option value="default">default</option>
          <option value="custom_text">custom_text</option>
        </select>
        <input
          placeholder="Watermark Text"
          value={newCustomer.watermark_text}
          onChange={(e) =>
            setNewCustomer((c) => ({
              ...c,
              watermark_text: e.target.value,
            }))
          }
        />
        <button type="submit">Create</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Watermark Policy</th>
            <th>Watermark Text</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c, idx) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>
                <input
                  value={c.name || ''}
                  onChange={(e) =>
                    handleFieldChange(idx, 'name', e.target.value)
                  }
                />
              </td>
              <td>
                <select
                  value={c.watermark_policy || ''}
                  onChange={(e) =>
                    handleFieldChange(idx, 'watermark_policy', e.target.value)
                  }
                >
                  <option value="none">none</option>
                  <option value="default">default</option>
                  <option value="custom_text">custom_text</option>
                </select>
              </td>
              <td>
                <input
                  value={c.watermark_text || ''}
                  onChange={(e) =>
                    handleFieldChange(idx, 'watermark_text', e.target.value)
                  }
                />
              </td>
              <td>
                <button onClick={() => handleUpdate(c)}>Save</button>
                <button onClick={() => handleDelete(c.id!)}>Delete</button>
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

