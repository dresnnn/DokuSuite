import { useCallback, useEffect, useRef, useState } from 'react'
import { apiClient } from '../../../lib/api'
import { useToast } from '../../components/Toast'

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

const isMetaEqual = (a: PageMeta, b: PageMeta) =>
  (a.page ?? null) === (b.page ?? null) &&
  (a.limit ?? null) === (b.limit ?? null) &&
  (a.total ?? null) === (b.total ?? null)

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [meta, setMetaState] = useState<PageMeta>({ page: 1, limit: 10, total: 0 })
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    watermark_policy: 'none',
    watermark_text: '',
  })
  const { showToast } = useToast()

  const metaRef = useRef(meta)

  useEffect(() => {
    metaRef.current = meta
  }, [meta])

  const updateMeta = useCallback(
    (updater: PageMeta | ((prev: PageMeta) => PageMeta)) => {
      setMetaState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        return isMetaEqual(prev, next) ? prev : next
      })
    },
    [],
  )

  const fetchCustomers = useCallback(
    async (page?: number, limit?: number) => {
      const currentMeta = metaRef.current
      const pageToLoad = page ?? currentMeta.page ?? 1
      const limitToLoad = limit ?? currentMeta.limit ?? 10
      try {
        const { data } = await apiClient.GET('/customers', {
          params: { query: { page: pageToLoad, limit: limitToLoad } },
        })
        if (data) {
          setCustomers(data.items || [])
          updateMeta(data.meta || {
            page: pageToLoad,
            limit: limitToLoad,
            total: 0,
          })
        }
      } catch {
        showToast('error', 'Failed to load customers')
      }
    },
    [showToast, updateMeta],
  )

  useEffect(() => {
    void fetchCustomers()
  }, [fetchCustomers])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await apiClient.POST('/customers', {
        body: {
          name: newCustomer.name,
          watermark_policy: newCustomer.watermark_policy,
          ...(newCustomer.watermark_policy === 'custom_text' &&
          newCustomer.watermark_text
            ? { watermark_text: newCustomer.watermark_text }
            : {}),
        },
      })
      setNewCustomer({ name: '', watermark_policy: 'none', watermark_text: '' })
      showToast('success', 'Customer created')
      const current = metaRef.current
      await fetchCustomers(current.page, current.limit)
    } catch {
      showToast('error', 'Failed to create customer')
    }
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
    try {
      await apiClient.PATCH('/customers/{id}', {
        params: { path: { id: c.id! } },
        body: {
          name: c.name,
          watermark_policy: c.watermark_policy,
          ...(c.watermark_policy === 'custom_text'
            ? { watermark_text: c.watermark_text }
            : {}),
        },
      })
      showToast('success', 'Customer updated')
      const current = metaRef.current
      await fetchCustomers(current.page, current.limit)
    } catch {
      showToast('error', 'Failed to update customer')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await apiClient.DELETE('/customers/{id}', { params: { path: { id } } })
      setCustomers((prev) => prev.filter((c) => c.id !== id))
      showToast('success', 'Customer deleted')
    } catch {
      showToast('error', 'Failed to delete customer')
    }
  }

  const totalPages = Math.ceil((meta.total || 0) / (meta.limit || 1)) || 1

  const changePage = (newPage: number) => {
    updateMeta((m) => ({ ...m, page: newPage }))
    void fetchCustomers(newPage)
  }

  const handleFetch = (e: React.FormEvent) => {
    e.preventDefault()
    void fetchCustomers(meta.page, meta.limit)
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
              updateMeta((m) => ({ ...m, page: Number(e.target.value) }))
            }
          />
        </label>
        <label>
          Limit:
          <input
            type="number"
            value={meta.limit}
            onChange={(e) =>
              updateMeta((m) => ({ ...m, limit: Number(e.target.value) }))
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
          onChange={(e) => {
            const policy = e.target.value
            setNewCustomer((c) => ({
              ...c,
              watermark_policy: policy,
              watermark_text: policy === 'custom_text' ? c.watermark_text : '',
            }))
          }}
        >
          <option value="none">none</option>
          <option value="default">default</option>
          <option value="custom_text">custom_text</option>
        </select>
        {newCustomer.watermark_policy === 'custom_text' && (
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
        )}
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
                  onChange={(e) => {
                    const policy = e.target.value
                    handleFieldChange(idx, 'watermark_policy', policy)
                    if (policy !== 'custom_text') {
                      handleFieldChange(idx, 'watermark_text', '')
                    }
                  }}
                >
                  <option value="none">none</option>
                  <option value="default">default</option>
                  <option value="custom_text">custom_text</option>
                </select>
              </td>
              <td>
                {c.watermark_policy === 'custom_text' && (
                  <input
                    placeholder="Watermark Text"
                    value={c.watermark_text || ''}
                    onChange={(e) =>
                      handleFieldChange(idx, 'watermark_text', e.target.value)
                    }
                  />
                )}
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

