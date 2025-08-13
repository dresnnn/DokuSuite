import { render, screen } from '@testing-library/react'
import Home from '../page'

describe('Home', () => {
  it('renders a heading', () => {
    render(<Home />)
    expect(screen.getByText('Deploy now')).toBeInTheDocument()
  })
})
