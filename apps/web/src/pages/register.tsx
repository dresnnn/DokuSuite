import { useState } from 'react'
import { useRouter } from 'next/router'
import { apiClient } from '../../lib/api'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const { data } = await apiClient.POST('/auth/register', {
      body: { email, password },
    })
    if (data) {
      router.push('/login')
    } else {
      setError('Registration failed')
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
      {error && (
        <div role="alert" style={{ color: 'red' }}>
          {error}
        </div>
      )}
    </form>
  )
}
