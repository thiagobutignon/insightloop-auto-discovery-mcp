import { render, screen } from '@testing-library/react'
import { GlassCard } from '../GlassCard'

describe('GlassCard', () => {
  it('renders children correctly', () => {
    render(
      <GlassCard>
        <div>Test Content</div>
      </GlassCard>
    )
    
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('applies default variant class', () => {
    const { container } = render(<GlassCard>Content</GlassCard>)
    const card = container.firstChild
    
    expect(card).toHaveClass('bg-glass')
  })

  it('applies dark variant class when specified', () => {
    const { container } = render(
      <GlassCard variant="dark">Content</GlassCard>
    )
    const card = container.firstChild
    
    expect(card).toHaveClass('bg-glass-dark')
  })

  it('applies light variant class when specified', () => {
    const { container } = render(
      <GlassCard variant="light">Content</GlassCard>
    )
    const card = container.firstChild
    
    expect(card).toHaveClass('bg-white/20')
  })

  it('applies hover effect when hoverable is true', () => {
    const { container } = render(
      <GlassCard hoverable>Content</GlassCard>
    )
    const card = container.firstChild
    
    expect(card).toHaveClass('hover:transform')
    expect(card).toHaveClass('hover:-translate-y-1')
  })

  it('applies custom className', () => {
    const { container } = render(
      <GlassCard className="custom-class">Content</GlassCard>
    )
    const card = container.firstChild
    
    expect(card).toHaveClass('custom-class')
  })

  it('applies correct blur class based on blur prop', () => {
    const { container } = render(
      <GlassCard blur="xl">Content</GlassCard>
    )
    const card = container.firstChild
    
    expect(card).toHaveClass('backdrop-blur-xl')
  })

  it('forwards ref correctly', () => {
    const ref = jest.fn()
    render(<GlassCard ref={ref}>Content</GlassCard>)
    
    expect(ref).toHaveBeenCalled()
  })
})