import type { Meta, StoryObj } from '@storybook/nextjs'
import { GlassCard } from '@/shared/components/GlassCard'

const meta = {
  title: 'Components/GlassCard',
  component: GlassCard,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        },
        {
          name: 'light',
          value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
      ],
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'dark', 'light'],
    },
    blur: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    hoverable: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof GlassCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-2 text-white">Glass Card</h2>
        <p className="text-white/80">
          This is a glassmorphic card component with backdrop blur and translucent background.
        </p>
      </div>
    ),
  },
}

export const Dark: Story = {
  args: {
    variant: 'dark',
    children: (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-2 text-white">Dark Glass Card</h2>
        <p className="text-white/80">
          A darker variant of the glass card for different themes.
        </p>
      </div>
    ),
  },
}

export const Light: Story = {
  args: {
    variant: 'light',
    children: (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-2 text-white">Light Glass Card</h2>
        <p className="text-white/80">
          A lighter variant with more transparency.
        </p>
      </div>
    ),
  },
}

export const Hoverable: Story = {
  args: {
    hoverable: true,
    children: (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-2 text-white">Hoverable Card</h2>
        <p className="text-white/80">
          Hover over this card to see the elevation effect.
        </p>
      </div>
    ),
  },
}

export const SmallBlur: Story = {
  args: {
    blur: 'sm',
    children: (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-2 text-white">Small Blur</h2>
        <p className="text-white/80">
          Minimal backdrop blur effect.
        </p>
      </div>
    ),
  },
}

export const ExtraLargeBlur: Story = {
  args: {
    blur: 'xl',
    children: (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-2 text-white">Extra Large Blur</h2>
        <p className="text-white/80">
          Maximum backdrop blur for a frosted glass effect.
        </p>
      </div>
    ),
  },
}

export const WithForm: Story = {
  args: {
    hoverable: true,
    children: (
      <div className="p-6 w-96">
        <h2 className="text-2xl font-bold mb-4 text-white">Login Form</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Password
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all"
          >
            Sign In
          </button>
        </form>
      </div>
    ),
  },
}