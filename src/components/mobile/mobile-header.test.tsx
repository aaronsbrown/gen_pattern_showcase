// AIDEV-NOTE: TDD implementation per G-5 - Mobile header tests written before implementation
// AIDEV-NOTE: Refactored per G-8 - Focus on user behavior, not CSS class assertions
import { render, screen, fireEvent } from '@testing-library/react'
import MobileHeader from './mobile-header'

describe('MobileHeader', () => {
  const defaultProps = {
    title: 'PATTERN GENERATOR SYSTEM',
    onMenuToggle: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Header Content and Visibility', () => {
    it('displays the title prominently to users', () => {
      render(<MobileHeader {...defaultProps} />)
      
      const title = screen.getByText('PATTERN GENERATOR SYSTEM')
      expect(title).toBeVisible()
      expect(title).toHaveTextContent('PATTERN GENERATOR SYSTEM')
    })

    it('renders a compact header layout suitable for mobile screens', () => {
      render(<MobileHeader {...defaultProps} />)
      
      const header = screen.getByTestId('mobile-header')
      expect(header).toBeVisible()
      
      // User should see all essential elements in the header
      expect(screen.getByText('PATTERN GENERATOR SYSTEM')).toBeVisible()
      expect(screen.getByTestId('menu-toggle')).toBeVisible()
    })

    it('maintains readability on small mobile screens', () => {
      // Simulate very small screen
      Object.defineProperty(window, 'innerWidth', { value: 320 })
      
      render(<MobileHeader {...defaultProps} />)
      
      // Title should still be readable (text truncation is a user experience feature)
      const title = screen.getByText('PATTERN GENERATOR SYSTEM')
      expect(title).toBeVisible()
      
      // All interactive elements should remain accessible
      expect(screen.getByTestId('menu-toggle')).toBeVisible()
    })
  })


  describe('Menu Toggle', () => {
    it('renders menu toggle button', () => {
      render(<MobileHeader {...defaultProps} />)
      
      const menuButton = screen.getByTestId('menu-toggle')
      expect(menuButton).toBeInTheDocument()
    })

    it('calls onMenuToggle when menu button is clicked', () => {
      render(<MobileHeader {...defaultProps} />)
      
      const menuButton = screen.getByTestId('menu-toggle')
      fireEvent.click(menuButton)
      
      expect(defaultProps.onMenuToggle).toHaveBeenCalledTimes(1)
    })

    it('provides an easily tappable menu button for mobile users', () => {
      render(<MobileHeader {...defaultProps} />)
      
      const menuButton = screen.getByTestId('menu-toggle')
      expect(menuButton).toBeVisible()
      
      // Button should be clearly interactive to users
      expect(menuButton).toBeEnabled()
      
      // Users should understand what the button does
      expect(menuButton).toHaveAttribute('aria-label', 'Open menu')
    })

    it('has proper accessibility attributes', () => {
      render(<MobileHeader {...defaultProps} />)
      
      const menuButton = screen.getByTestId('menu-toggle')
      expect(menuButton).toHaveAttribute('aria-label', 'Open menu')
      expect(menuButton).toHaveAttribute('type', 'button')
    })
  })

  // Theme toggle has been moved to the menu overlay, not in the header

  describe('Mobile User Experience', () => {
    it('provides usable interface on very small screens', () => {
      // Simulate very small screen
      Object.defineProperty(window, 'innerWidth', { value: 320 })
      
      render(<MobileHeader {...defaultProps} />)
      
      // Users should still be able to see and interact with all key elements
      const header = screen.getByTestId('mobile-header')
      const title = screen.getByText('PATTERN GENERATOR SYSTEM')
      const controls = screen.getByTestId('header-controls')
      const menuButton = screen.getByTestId('menu-toggle')
      
      expect(header).toBeVisible()
      expect(title).toBeVisible()
      expect(controls).toBeVisible()
      expect(menuButton).toBeVisible()
      expect(menuButton).toBeEnabled()
    })

    it('allows users to interact with menu regardless of screen size', () => {
      Object.defineProperty(window, 'innerWidth', { value: 320 })
      
      render(<MobileHeader {...defaultProps} />)
      
      const menuButton = screen.getByTestId('menu-toggle')
      fireEvent.click(menuButton)
      
      expect(defaultProps.onMenuToggle).toHaveBeenCalledTimes(1)
    })
  })

  describe('Visual Hierarchy and User Recognition', () => {
    it('makes the title clearly identifiable as the main header', () => {
      render(<MobileHeader {...defaultProps} />)
      
      const title = screen.getByText('PATTERN GENERATOR SYSTEM')
      
      // Users should be able to immediately identify this as the main title
      expect(title).toBeVisible()
      expect(title).toHaveTextContent('PATTERN GENERATOR SYSTEM')
    })


    it('provides sufficient visual separation between header and page content', () => {
      render(<MobileHeader {...defaultProps} />)
      
      const header = screen.getByTestId('mobile-header')
      
      // Users should perceive header as separate from main content
      expect(header).toBeVisible()
      expect(header).toContainElement(screen.getByText('PATTERN GENERATOR SYSTEM'))
    })
  })

  describe('Edge Cases and User Experience', () => {
    it('provides meaningful fallback when title is missing', () => {
      const props = { ...defaultProps, title: '' }
      render(<MobileHeader {...props} />)
      
      // Users should see a fallback title instead of empty space
      expect(screen.getByText('EIDOS ENGINE')).toBeVisible()
      
      // Other functionality should remain available to users
      expect(screen.getByTestId('menu-toggle')).toBeEnabled()
    })



    it('maintains usability when title is extremely long', () => {
      const props = {
        ...defaultProps,
        title: 'EXTREMELY LONG PATTERN GENERATOR SYSTEM TITLE THAT MIGHT OVERFLOW ON SMALL SCREENS AND CAUSE LAYOUT ISSUES'
      }
      
      render(<MobileHeader {...props} />)
      
      // Users should still be able to see and use all controls
      const title = screen.getByText(props.title)
      expect(title).toBeVisible()
      expect(screen.getByTestId('menu-toggle')).toBeEnabled()
      
      // Menu should still be functional
      fireEvent.click(screen.getByTestId('menu-toggle'))
      expect(defaultProps.onMenuToggle).toHaveBeenCalledTimes(1)
    })
  })

  describe('User Experience Consistency', () => {
    it('maintains stable interface when props do not change', () => {
      const { rerender } = render(<MobileHeader {...defaultProps} />)
      
      // Capture initial state that users see
      const initialTitle = screen.getByText('PATTERN GENERATOR SYSTEM')
      const initialButton = screen.getByTestId('menu-toggle')
      
      expect(initialTitle).toBeVisible()
      expect(initialButton).toBeEnabled()
      
      // Re-render with same props
      rerender(<MobileHeader {...defaultProps} />)
      
      // Users should see the same stable interface
      expect(screen.getByText('PATTERN GENERATOR SYSTEM')).toBeVisible()
      expect(screen.getByTestId('menu-toggle')).toBeEnabled()
    })
  })
})