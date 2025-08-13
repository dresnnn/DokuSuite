/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import { apiClient } from '../../../lib/api'

type Share = {
  id?: number
  order_id?: number
  url?: string
}

export default function SharesPage() {
  const [shares, setShares] = useState<Share[]>([])
  const [orderId, setOrderId] = useState('')
  const [email, setEmail] = useState('')

  const client = apiClient as unknown as {
    GET: typeof apiClient.GET
    DELETE: typeof apiClient.DELETE
  }

  const fetchShares = async () => {
    const { data } = await client.GET('/shares')
    if (data) setShares(data)
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
      },
    })
    if (data) {
      setShares((prev) => [...prev, data])
      setOrderId('')
      setEmail('')
    }
  }

  const handleDelete = async (id: number) => {
    await client.DELETE('/shares/{id}', {
      params: { path: { id } },
    })
    setShares((prev) => prev.filter((s) => s.id !== id))
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
    </div>
  )
}
