import type { EducationalContent } from '@/components/ui/educational-overlay'
import { parseEducationalContent } from './educational-content-parser'
import { patternGenerators } from '@/components/pattern-generators'
import { hasSemanticMetadata } from './semantic-types'

// AIDEV-NOTE: Educational content loader with fallbacks for Storybook compatibility
export class EducationalContentLoader {
  private static cache = new Map<string, EducationalContent>()
  
  /**
   * Load educational content by pattern ID, with fallback to hard-coded content
   * @param patternId - Pattern identifier (e.g., 'cellular-automaton')
   * @returns Promise<EducationalContent>
   */
  static async loadContent(patternId: string): Promise<EducationalContent> {
    // Check cache first
    if (this.cache.has(patternId)) {
      return this.cache.get(patternId)!
    }

    // AIDEV-NOTE: Check for explicit educational content link in pattern metadata first
    const pattern = patternGenerators.find(p => p.id === patternId)
    let contentId = patternId // Default to pattern ID for backward compatibility
    
    if (pattern && hasSemanticMetadata(pattern) && pattern.semantics.educationalContent) {
      contentId = pattern.semantics.educationalContent.contentId
    }

    try {
      // Try to load from public directory (works in production and dev)
      const response = await fetch(`/educational-content/${contentId}.md`)
      
      if (response.ok) {
        const markdownContent = await response.text()
        const parsedContent = parseEducationalContent(markdownContent)
        
        // Cache the parsed content
        this.cache.set(patternId, parsedContent)
        return parsedContent
      }
    } catch (error) {
      console.warn(`Failed to load educational content for ${patternId} (contentId: ${contentId}):`, error)
    }

    // Fallback to hard-coded content for Storybook and error cases
    return this.getFallbackContent(patternId)
  }

  /**
   * Get content synchronously (for Storybook and initial renders)
   * @param patternId - Pattern identifier
   * @returns EducationalContent
   */
  static getContentSync(patternId: string): EducationalContent {
    // Check cache first
    if (this.cache.has(patternId)) {
      return this.cache.get(patternId)!
    }

    // Return fallback content immediately
    return this.getFallbackContent(patternId)
  }

  /**
   * Get generic fallback content for when file loading fails
   * @param patternId - Pattern identifier
   * @returns EducationalContent
   */
  private static getFallbackContent(patternId: string): EducationalContent {
    // Generic fallback for all patterns when file loading fails
    return {
      title: `Educational Content: ${patternId}`,
      layers: {
        intuitive: {
          title: "What is this?",
          audienceHint: "Beginner-friendly",
          content: "Educational content is being loaded..."
        },
        conceptual: {
          title: "How does this work?", 
          audienceHint: "Intermediate",
          content: "Educational content is being loaded..."
        },
        technical: {
          title: "Show me the code",
          audienceHint: "Advanced", 
          content: "Educational content is being loaded..."
        }
      }
    }
  }

  /**
   * Preload content for a pattern (useful for performance)
   * @param patternId - Pattern identifier
   */
  static async preloadContent(patternId: string): Promise<void> {
    await this.loadContent(patternId)
  }

  /**
   * Clear cache (useful for testing)
   */
  static clearCache(): void {
    this.cache.clear()
  }

  /**
   * Validate that all pattern generators have corresponding educational content files
   * @returns Array of missing pattern IDs
   */
  static async validateEducationalContent(): Promise<string[]> {
    const missingContent: string[] = []
    
    for (const pattern of patternGenerators) {
      try {
        const response = await fetch(`/educational-content/${pattern.id}.md`)
        if (!response.ok) {
          missingContent.push(pattern.id)
        }
      } catch {
        missingContent.push(pattern.id)
      }
    }
    
    return missingContent
  }

  /**
   * Get all pattern IDs that should have educational content
   * @returns Array of all pattern IDs
   */
  static getAllPatternIds(): string[] {
    return patternGenerators.map(pattern => pattern.id)
  }

  /**
   * Check if educational content exists for a specific pattern ID
   * @param patternId - Pattern identifier to check
   * @returns Promise<boolean> indicating if content exists
   */
  static async hasEducationalContent(patternId: string): Promise<boolean> {
    try {
      // AIDEV-NOTE: Check explicit content ID from metadata if available
      const pattern = patternGenerators.find(p => p.id === patternId)
      let contentId = patternId
      
      if (pattern && hasSemanticMetadata(pattern) && pattern.semantics.educationalContent) {
        contentId = pattern.semantics.educationalContent.contentId
      }
      
      const response = await fetch(`/educational-content/${contentId}.md`)
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Get related educational content for a pattern based on cross-references
   * @param patternId - Pattern identifier
   * @returns Array of related pattern IDs with educational content
   */
  static getRelatedEducationalContent(patternId: string): string[] {
    const pattern = patternGenerators.find(p => p.id === patternId)
    
    if (!pattern || !hasSemanticMetadata(pattern) || !pattern.semantics.educationalContent) {
      return []
    }
    
    return pattern.semantics.educationalContent.crossReferences || []
  }

  /**
   * Get patterns that reference this pattern's educational content
   * @param patternId - Pattern identifier
   * @returns Array of pattern IDs that cross-reference this pattern
   */
  static getEducationalContentReferences(patternId: string): string[] {
    const referencingPatterns: string[] = []
    
    for (const pattern of patternGenerators) {
      if (hasSemanticMetadata(pattern) && pattern.semantics.educationalContent) {
        const crossRefs = pattern.semantics.educationalContent.crossReferences || []
        if (crossRefs.includes(patternId)) {
          referencingPatterns.push(pattern.id)
        }
      }
    }
    
    return referencingPatterns
  }

  /**
   * Get related concepts for a pattern
   * @param patternId - Pattern identifier
   * @returns Array of related concept IDs
   */
  static getRelatedConcepts(patternId: string): string[] {
    const pattern = patternGenerators.find(p => p.id === patternId)
    
    if (!pattern || !hasSemanticMetadata(pattern) || !pattern.semantics.educationalContent) {
      return []
    }
    
    return pattern.semantics.educationalContent.relatedConcepts || []
  }
}

// AIDEV-NOTE: Convenience function for backward compatibility
export async function loadEducationalContent(patternId: string): Promise<EducationalContent> {
  return EducationalContentLoader.loadContent(patternId)
}

// AIDEV-NOTE: Sync version for immediate use (uses cache or fallback)
export function getEducationalContentSync(patternId: string): EducationalContent {
  return EducationalContentLoader.getContentSync(patternId)
}

// AIDEV-NOTE: Validation convenience functions
export async function validateEducationalContent(): Promise<string[]> {
  return EducationalContentLoader.validateEducationalContent()
}

export function getAllPatternIds(): string[] {
  return EducationalContentLoader.getAllPatternIds()
}

export async function hasEducationalContent(patternId: string): Promise<boolean> {
  return EducationalContentLoader.hasEducationalContent(patternId)
}

// AIDEV-NOTE: New convenience functions for cross-reference and related concepts
export function getRelatedEducationalContent(patternId: string): string[] {
  return EducationalContentLoader.getRelatedEducationalContent(patternId)
}

export function getEducationalContentReferences(patternId: string): string[] {
  return EducationalContentLoader.getEducationalContentReferences(patternId)
}

export function getRelatedConcepts(patternId: string): string[] {
  return EducationalContentLoader.getRelatedConcepts(patternId)
}