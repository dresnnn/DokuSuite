/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { apiClient } from '../../../lib/api'

type Share = {
  id?: number
  order_id?: number
  url?: string
}

type PageMeta = {
  page?: number
  limit?: number
  total?: number
}

export default function SharesPage() {
  const [shares, setShares] = useState<Share[]>([])
  const [meta, setMeta] = useState<PageMeta>({ page: 1, limit: 10, total: 0 })
  const [orderId, setOrderId] = useState('')
  const [email, setEmail] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [watermarkPolicy, setWatermarkPolicy] = useState('')
  const [watermarkText, setWatermarkText] = useState('')

  const client = apiClient as unknown as {
    GET: typeof apiClient.GET
    POST: typeof apiClient.POST
  }

  const fetchShares = async (page = meta.page, limit = meta.limit) => {
    const { data } = await client.GET('/shares', {
      params: { query: { page, limit } },
    })
    if (data) {
      setShares(data.items || [])
      setMeta(data.meta || { page, limit, total: 0 })
    }
  }

  useEffect(() => {
    fetchShares()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data } = await apiClient.POST('/shares', {
      body: {
        order_id: Number(orderId),
        email: email || null,
        download_allowed: true,
        expires_at: expiresAt || null,
        watermark_policy: watermarkPolicy || undefined,
        watermark_text:
          watermarkPolicy === 'custom_text' ? watermarkText || null : undefined,
      },
    })
    if (data) {
      setShares((prev) => [...prev, data])
      setOrderId('')
      setEmail('')
      setExpiresAt('')
      setWatermarkPolicy('')
      setWatermarkText('')
    }
  }

  const handleDelete = async (id: number) => {
    await client.POST('/shares/{id}/revoke', {
      params: { path: { id } },
    })
    setShares((prev) => prev.filter((s) => s.id !== id))
  }

  const totalPages = Math.ceil((meta.total || 0) / (meta.limit || 1)) || 1

  const changePage = (newPage: number) => {
    setMeta((m) => ({ ...m, page: newPage }))
    fetchShares(newPage)
  }

  return (
    <div>
      <form onSubmit={handleCreate} style={{ marginBottom: '1rem' }}>
        <input
          placeholder="Order ID"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="datetime-local"
          placeholder="Expires At"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
        <select
          aria-label="Watermark Policy"
          value={watermarkPolicy}
          onChange={(e) => setWatermarkPolicy(e.target.value)}
        >
          <option value="">Watermark Policy</option>
          <option value="none">none</option>
          <option value="default">default</option>
          <option value="custom_text">custom_text</option>
        </select>
        {watermarkPolicy === 'custom_text' ? (
          <input
            placeholder="Watermark Text"
            value={watermarkText}
            onChange={(e) => setWatermarkText(e.target.value)}
          />
        ) : null}
        <button type="submit">Create</button>
      </form>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Order ID</th>
            <th>URL</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {shares.map((s) => (
            <tr key={s.id}>
              <td>{s.id}</td>
              <td>{s.order_id}</td>
              <td>
                {s.url ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.url}
                  </a>
                ) : null}
              </td>
              <td>
                <button onClick={() => handleDelete(s.id!)}>Revoke</button>
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
