import { useEffect, useState } from 'react'
import { apiClient } from '../../../lib/api'

type User = {
  id?: number
  email?: string
  role?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    const { data } = await apiClient.GET('/users')
    if (data) {
      setUsers(data)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleRoleChange = async (id: number, role: string) => {
    await apiClient.PATCH('/users/{id}', {
      params: { path: { id } },
      body: { role },
    })
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
  }

  const handleDelete = async (id: number) => {
    await apiClient.DELETE('/users/{id}', {
      params: { path: { id } },
    })
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const { error: err } = await apiClient.POST('/auth/invite', {
      body: { email: inviteEmail },
    })
    if (err) {
      setError('Invite failed')
    } else {
      setInviteEmail('')
    }
  }

  return (
    <div>
      <form onSubmit={handleInvite} style={{ marginBottom: '1rem' }}>
        <input
          placeholder="Email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
        />
        <button type="submit">Invite</button>
      </form>
      {error && (
        <div role="alert" style={{ color: 'red' }}>
          {error}
        </div>
      )}
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.email}</td>
              <td>
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id!, e.target.value)}
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="USER">USER</option>
                </select>
              </td>
              <td>
                <button onClick={() => handleDelete(u.id!)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
