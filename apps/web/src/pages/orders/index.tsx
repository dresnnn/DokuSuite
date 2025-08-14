/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiClient } from '../../../lib/api'
import { useToast } from '../../components/Toast'

type Order = {
  id?: number
  customer_id?: string
  name?: string
  status?: string
}

type PageMeta = {
  page?: number
  limit?: number
  total?: number
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [meta, setMeta] = useState<PageMeta>({ page: 1, limit: 10, total: 0 })
  const [customerId, setCustomerId] = useState('')
  const [status, setStatus] = useState('')
  const [newOrder, setNewOrder] = useState({
    customer_id: '',
    name: '',
    status: 'reserved',
  })
  const { showToast } = useToast()

  const fetchOrders = async (page = meta.page, limit = meta.limit) => {
    try {
      const { data } = await apiClient.GET('/orders', {
        params: {
          query: {
            page,
            limit,
            customerId: customerId || undefined,
            status: status || undefined,
          },
        },
      })
      if (data) {
        setOrders(data.items || [])
        setMeta(data.meta || { page, limit, total: 0 })
      }
    } catch {
      showToast('error', 'Failed to load orders')
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOrders()
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data } = await apiClient.POST('/orders', { body: newOrder })
      if (data) {
        setNewOrder({ customer_id: '', name: '', status: 'reserved' })
        showToast('success', 'Order created')
        fetchOrders()
      } else {
        showToast('error', 'Failed to create order')
      }
    } catch {
      showToast('error', 'Failed to create order')
    }
  }

  const totalPages = Math.ceil((meta.total || 0) / (meta.limit || 1)) || 1

  const changePage = (newPage: number) => {
    setMeta((m) => ({ ...m, page: newPage }))
    fetchOrders(newPage)
  }

  return (
    <div>
      <form onSubmit={handleFilterSubmit} style={{ marginBottom: '1rem' }}>
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
          Customer ID:
          <input
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          />
        </label>
        <label>
          Status:
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Any</option>
            <option value="reserved">reserved</option>
            <option value="booked">booked</option>
            <option value="cancelled">cancelled</option>
          </select>
        </label>
        <button type="submit">Fetch</button>
      </form>

      <form onSubmit={handleCreate} style={{ marginBottom: '1rem' }}>
        <input
          placeholder="Customer ID"
          value={newOrder.customer_id}
          onChange={(e) =>
            setNewOrder((o) => ({ ...o, customer_id: e.target.value }))
          }
        />
        <input
          placeholder="Name"
          value={newOrder.name}
          onChange={(e) => setNewOrder((o) => ({ ...o, name: e.target.value }))}
        />
        <select
          value={newOrder.status}
          onChange={(e) => setNewOrder((o) => ({ ...o, status: e.target.value }))}
        >
          <option value="reserved">reserved</option>
          <option value="booked">booked</option>
          <option value="cancelled">cancelled</option>
        </select>
        <button type="submit">Create</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Status</th>
            <th>Customer</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                {o.id !== undefined && (
                  <Link href={`/orders/${o.id}`}>{o.id}</Link>
                )}
              </td>
              <td>{o.name}</td>
              <td>{o.status}</td>
              <td>{o.customer_id}</td>
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

