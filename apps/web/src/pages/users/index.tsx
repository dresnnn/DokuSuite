import { useEffect, useState } from 'react'
import { apiClient } from '../../../lib/api'
import { useToast } from '../../components/Toast'

type User = {
  id?: number
  email?: string
  role?: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const { showToast } = useToast()

  const fetchUsers = async () => {
    try {
      const { data } = await apiClient.GET('/users')
      if (data) {
        setUsers(data)
      }
    } catch {
      showToast('error', 'Failed to load users')
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleRoleChange = async (id: number, role: string) => {
    try {
      await apiClient.PATCH('/users/{id}', {
        params: { path: { id } },
        body: { role },
      })
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
      showToast('success', 'Role updated')
    } catch {
      showToast('error', 'Failed to update role')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await apiClient.DELETE('/users/{id}', {
        params: { path: { id } },
      })
      setUsers((prev) => prev.filter((u) => u.id !== id))
      showToast('success', 'User deleted')
    } catch {
      showToast('error', 'Failed to delete user')
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await apiClient.POST('/auth/invite', {
      body: { email: inviteEmail },
    })
    if (error) {
      showToast('error', 'Invite failed')
    } else {
      setInviteEmail('')
      showToast('success', 'Invite sent')
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
