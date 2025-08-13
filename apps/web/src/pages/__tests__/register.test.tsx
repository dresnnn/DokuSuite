import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import RegisterPage from '../register'
import { apiClient } from '../../../lib/api'
import { useRouter } from 'next/router'

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

const mockedUseRouter = useRouter as jest.Mock

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('redirects to login on successful registration', async () => {
    const push = jest.fn()
    mockedUseRouter.mockReturnValue({ push })

    jest
      .spyOn(apiClient, 'POST')
      .mockResolvedValue({ data: {} } as unknown as Awaited<
        ReturnType<typeof apiClient.POST>
      >)

    render(<RegisterPage />)

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pw' },
    })
    fireEvent.click(screen.getByText('Register'))

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/login')
    })
  })

  it('shows error on failed registration', async () => {
    mockedUseRouter.mockReturnValue({ push: jest.fn() })
    jest
      .spyOn(apiClient, 'POST')
      .mockResolvedValue({ data: undefined, error: {} } as unknown as Awaited<
        ReturnType<typeof apiClient.POST>
      >)

    render(<RegisterPage />)

    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'pw' },
    })
    fireEvent.click(screen.getByText('Register'))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Registration failed')
    })
  })
})
