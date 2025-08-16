import { render, screen } from '@testing-library/react'
import App from '../src/App'

describe('Smoke', () => {
  it('home muestra heading y links', async () => {
    render(<App />)

    // heading principal
    expect(await screen.findByRole('heading', { name: /AuraNovaDigital/i }))
      .toBeInTheDocument()

    // Links por NOMBRE (texto visible) y además verificamos el href
    const admin = await screen.findByRole('link', { name: /admin/i })
    const wizard = await screen.findByRole('link', { name: /configuración/i })

    expect(admin).toHaveAttribute('href', expect.stringMatching(/\/admin$/))
    expect(wizard).toHaveAttribute('href', expect.stringMatching(/\/admin\/wizard$/))
  })
})
