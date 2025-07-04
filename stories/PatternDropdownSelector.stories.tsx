import type { Meta, StoryObj } from '@storybook/react'
import PatternDropdownSelector from '@/components/mobile/pattern-dropdown-selector'
import type { MixedPatternGenerator } from '@/components/pattern-generators/types'

// Mock pattern data for stories
const mockPatterns: MixedPatternGenerator[] = [
  {
    id: 'cellular-automaton',
    name: 'Cellular Automaton',
    component: {} as any,
    technology: 'CANVAS_2D',
    category: 'Simulation'
  },
  {
    id: 'particle-system',
    name: 'Particle System',
    component: {} as any,
    technology: 'WEBGL_2.0',
    category: 'Simulation'
  },
  {
    id: 'four-pole-gradient',
    name: 'Four Pole Gradient',
    component: {} as any,
    technology: 'CANVAS_2D',
    category: 'Geometric'
  },
  {
    id: 'noise-field',
    name: 'Noise Field Generator',
    component: {} as any,
    technology: 'WEBGL_2.0',
    category: 'Noise'
  },
  {
    id: 'brownian-motion',
    name: 'Brownian Motion',
    component: {} as any,
    technology: 'WEBGL_2.0',
    category: 'Noise'
  },
  {
    id: 'trigonometric-circle',
    name: 'Trigonometric Circle',
    component: {} as any,
    technology: 'CANVAS_2D',
    category: 'Geometric'
  }
]

const meta: Meta<typeof PatternDropdownSelector> = {
  title: 'Mobile Components/Pattern Dropdown Selector',
  component: PatternDropdownSelector,
  parameters: {
    layout: 'padded',
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1200px',
            height: '800px',
          },
        },
      },
      defaultViewport: 'mobile',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    patterns: {
      control: false, // Too complex for control
    },
    selectedId: {
      control: { type: 'select' },
      options: mockPatterns.map(p => p.id),
    },
    searchable: {
      control: { type: 'boolean' },
    },
    loading: {
      control: { type: 'boolean' },
    },
    onSelect: { action: 'pattern selected' },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default dropdown
export const Default: Story = {
  args: {
    patterns: mockPatterns,
    selectedId: 'cellular-automaton',
    searchable: true,
    loading: false,
    onSelect: (patternId: string) => console.log('Selected:', patternId),
  },
}

// No selection state
export const NoSelection: Story = {
  args: {
    patterns: mockPatterns,
    selectedId: '',
    searchable: true,
    loading: false,
    onSelect: (patternId: string) => console.log('Selected:', patternId),
  },
}

// Loading state
export const Loading: Story = {
  args: {
    patterns: [],
    selectedId: '',
    searchable: true,
    loading: true,
    onSelect: (patternId: string) => console.log('Selected:', patternId),
  },
}

// Empty state
export const Empty: Story = {
  args: {
    patterns: [],
    selectedId: '',
    searchable: true,
    loading: false,
    onSelect: (patternId: string) => console.log('Selected:', patternId),
  },
}

// Without search
export const NoSearch: Story = {
  args: {
    patterns: mockPatterns,
    selectedId: 'particle-system',
    searchable: false,
    loading: false,
    onSelect: (patternId: string) => console.log('Selected:', patternId),
  },
}

// Mobile responsive showcase
export const ResponsiveDemo: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Pattern Selector</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Touch-friendly dropdown with search functionality
        </p>
      </div>
      
      <div className="max-w-sm mx-auto">
        <PatternDropdownSelector
          patterns={mockPatterns}
          selectedId="cellular-automaton"
          searchable={true}
          loading={false}
          onSelect={(patternId: string) => console.log('Selected:', patternId)}
        />
      </div>
      
      <div className="text-xs text-muted-foreground text-center mt-4">
        <p>• Touch-optimized 44px minimum height</p>
        <p>• Keyboard navigation support</p>
        <p>• Responsive typography scaling</p>
        <p>• Scroll lock when open</p>
      </div>
    </div>
  ),
}

// Category showcase demo
export const CategoryShowcase: Story = {
  render: () => (
    <div className="grid gap-6 max-w-2xl mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Pattern Categories</h3>
        <p className="text-sm text-muted-foreground">Patterns organized into collapsible categories with search across all groups</p>
      </div>
      
      <div className="max-w-sm mx-auto">
        <PatternDropdownSelector
          patterns={mockPatterns}
          selectedId="cellular-automaton"
          searchable={true}
          loading={false}
          onSelect={(patternId: string) => console.log('Category Selected:', patternId)}
        />
      </div>
      
      <div className="text-xs text-muted-foreground text-center space-y-1">
        <p>• <strong>Collapsible Categories:</strong> Noise, Geometric, Simulation, Data Visualization</p>
        <p>• <strong>Smart Expansion:</strong> Selected pattern's category expands automatically</p>
        <p>• <strong>Search Integration:</strong> Search across all patterns with category context</p>
        <p>• <strong>Clean Information:</strong> Pattern name + category (in search) or just name (when grouped)</p>
        <p>• <strong>Visual Hierarchy:</strong> Category headers with pattern counts and indented lists</p>
      </div>
    </div>
  ),
}

// Technology filter demo
export const TechnologyShowcase: Story = {
  render: () => (
    <div className="grid gap-4 max-w-2xl mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">Technology Types</h3>
        <p className="text-sm text-muted-foreground">Patterns grouped by rendering technology</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Canvas 2D Patterns</h4>
          <PatternDropdownSelector
            patterns={mockPatterns.filter(p => p.technology === 'CANVAS_2D')}
            selectedId="cellular-automaton"
            searchable={true}
            loading={false}
            onSelect={(patternId: string) => console.log('Canvas 2D Selected:', patternId)}
          />
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">WebGL 2.0 Patterns</h4>
          <PatternDropdownSelector
            patterns={mockPatterns.filter(p => p.technology === 'WEBGL_2.0')}
            selectedId="particle-system"
            searchable={true}
            loading={false}
            onSelect={(patternId: string) => console.log('WebGL Selected:', patternId)}
          />
        </div>
      </div>
    </div>
  ),
}

// Search functionality demo
export const SearchDemo: Story = {
  render: () => (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Search Functionality</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Search across pattern names, IDs, and categories
        </p>
      </div>
      
      <PatternDropdownSelector
        patterns={mockPatterns}
        selectedId=""
        searchable={true}
        loading={false}
        onSelect={(patternId: string) => console.log('Search Selected:', patternId)}
      />
      
      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Search features:</strong></p>
        <p>• Search by pattern name, category, or technology</p>
        <p>• Category context shown under each result</p>
        <p>• Clean flat list when searching across categories</p>
        <p>• Try: "simulation", "noise", "cellular", or "webgl"</p>
      </div>
    </div>
  ),
}