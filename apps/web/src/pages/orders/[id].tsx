import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { apiClient } from '../../../lib/api'
import { loadExportJobs, saveExportJobs, ExportJob } from '../../../lib/exportJobs'
import { useToast } from '../../components/Toast'

type Order = {
  customer_id?: string
  name?: string
  status?: string
}

export default function OrderDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const [order, setOrder] = useState<Order>({})
  const { showToast } = useToast()

  useEffect(() => {
    if (!id) return
    const fetchOrder = async () => {
      const { data } = await apiClient.GET('/orders/{id}', {
        params: { path: { id: Number(id) } },
      })
      if (data) setOrder(data)
    }
    fetchOrder()
  }, [id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    setOrder((o) => ({ ...o, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    try {
      await apiClient.PATCH('/orders/{id}', {
        params: { path: { id: Number(id) } },
        body: {
          customer_id: order.customer_id || '',
          name: order.name || '',
          status: order.status || '',
        },
      })
      showToast('success', 'Order updated')
    } catch {
      showToast('error', 'Update failed')
    }
  }

  const triggerExport = async (type: 'zip' | 'excel' | 'pdf') => {
    if (!id) return
    const endpoint:
      | '/exports/zip'
      | '/exports/excel'
      | '/exports/pdf' =
      type === 'zip'
        ? '/exports/zip'
        : type === 'excel'
        ? '/exports/excel'
        : '/exports/pdf'
    const { data } = await apiClient.POST(endpoint, {
      body: { orderId: Number(id) },
    })
    if (data) {
      const jobs = loadExportJobs()
      saveExportJobs([...jobs, data as ExportJob])
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Customer ID:
        <input
          name="customer_id"
          value={order.customer_id || ''}
          onChange={handleChange}
        />
      </label>
      <label>
        Name:
        <input name="name" value={order.name || ''} onChange={handleChange} />
      </label>
      <label>
        Status:
        <select
          name="status"
          value={order.status || ''}
          onChange={handleChange}
        >
          <option value=""></option>
          <option value="reserved">reserved</option>
          <option value="booked">booked</option>
          <option value="cancelled">cancelled</option>
        </select>
      </label>
      <button type="submit">Save</button>
      <button type="button" onClick={() => triggerExport('zip')}>
        Export ZIP
      </button>
      <button type="button" onClick={() => triggerExport('excel')}>
        Export Excel
      </button>
      <button type="button" onClick={() => triggerExport('pdf')}>
        Export PDF
      </button>
    </form>
  )
}
