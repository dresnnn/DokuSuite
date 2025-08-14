import { useState } from 'react'
import { useRouter } from 'next/router'
import { apiClient } from '../../lib/api'
import { useToast } from '../components/Toast'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const { showToast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data } = await apiClient.POST('/auth/register', {
        body: { email, password },
      })
      if (data) {
        showToast('success', 'Registration successful')
        router.push('/login')
      } else {
        showToast('error', 'Registration failed')
      }
    } catch {
      showToast('error', 'Registration failed')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Register</button>
    </form>
  )
}
