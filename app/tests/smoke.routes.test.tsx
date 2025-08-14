import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../src/App'   // si tu entry real es otro, ajústalo

describe('Smoke', () => {
  it('home muestra heading y links', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: /AuraNovaDigital/i })).toBeInTheDocument()
    expect(await screen.findByRole('link',   { name: /^\/admin$/i })).toBeInTheDocument()
    expect(await screen.findByRole('link',   { name: /^\/admin\/wizard$/i })).toBeInTheDocument()
  })
})
