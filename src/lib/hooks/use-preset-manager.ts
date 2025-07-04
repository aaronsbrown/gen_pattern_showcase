// AIDEV-NOTE: React hook for preset management - integrates with existing controlValues state pattern
"use client"

import { useState, useCallback, useEffect, useRef } from 'react'
import { PresetManager, PatternPreset } from '../preset-manager'
import { PatternControl } from '@/components/pattern-generators/types'

export interface UsePresetManagerOptions {
  patternId: string
  controlValues: Record<string, number | string | boolean>
  onControlValuesChange: (newValues: Record<string, number | string | boolean>) => void
  patternControls?: PatternControl[]
}

export interface UsePresetManagerReturn {
  // Preset data
  presets: PatternPreset[]
  activePresetId: string | null
  isLoading: boolean
  error: string | null
  
  // Core operations
  savePreset: (name: string, description?: string) => Promise<boolean>
  loadPreset: (presetId: string) => Promise<boolean>
  deletePreset: (presetId: string) => Promise<boolean>
  renamePreset: (presetId: string, newName: string) => Promise<boolean>
  clearActivePreset: () => void
  
  // Utility operations
  refreshPresets: () => void
  clearError: () => void
  validatePreset: (presetId: string) => { valid: boolean; warnings: string[] }
  
  // Export/Import (basic - full implementation in future)
  exportPreset: (presetId: string) => string
  importPreset: (jsonData: string) => Promise<boolean>
  
  // Factory preset operations
  restoreFactoryPresets: () => Promise<{ imported: number; skipped: number }>
}

/**
 * Hook for managing pattern presets
 * Integrates with existing pattern control state management
 */
export function usePresetManager({
  patternId,
  controlValues,
  onControlValuesChange,
  patternControls = []
}: UsePresetManagerOptions): UsePresetManagerReturn {
  const [presets, setPresets] = useState<PatternPreset[]>([])
  const [activePresetId, setActivePresetId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // AIDEV-NOTE: Load presets for current pattern on mount and pattern change
  const refreshPresets = useCallback(async () => {
    try {
      // One-time cleanup of old factory presets from localStorage
      PresetManager.cleanupFactoryPresetsFromStorage()
      
      // Load fresh factory + user presets for this pattern
      const loadedPresets = await PresetManager.getPresetsForGenerator(patternId)
      setPresets(loadedPresets)
      
      // Check if last active preset is still valid
      const lastActive = PresetManager.getLastActivePreset()
      if (lastActive && loadedPresets.some(p => p.id === lastActive)) {
        setActivePresetId(lastActive)
      } else if (loadedPresets.length > 0) {
        // If no valid last active preset, find and load the effective default
        const effectiveDefault = await PresetManager.getEffectiveDefault(patternId)
        
        if (effectiveDefault) {
          setActivePresetId(effectiveDefault.id)
          PresetManager.setLastActivePreset(effectiveDefault.id)
          
          // Auto-load the effective default preset parameters
          const validParameters: Record<string, number | string | boolean> = {}
          const currentControlIds = new Set(patternControls.map(c => c.id))
          
          Object.entries(effectiveDefault.parameters).forEach(([key, value]) => {
            if (currentControlIds.has(key)) {
              validParameters[key] = value
            }
          })
          
          onControlValuesChange(validParameters)
        } else {
          setActivePresetId(null)
        }
      } else {
        setActivePresetId(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load presets')
    }
  }, [patternId, patternControls, onControlValuesChange])

  // AIDEV-NOTE: Use ref to avoid dependency cycle in all effects
  const refreshPresetsRef = useRef(refreshPresets)
  refreshPresetsRef.current = refreshPresets

  // Load presets when component mounts or pattern changes
  useEffect(() => {
    refreshPresetsRef.current()
  }, [patternId]) // Only depend on patternId, not the function itself

  // AIDEV-NOTE: Listen for localStorage changes to sync preset updates between components
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'pattern-generator-presets' && event.newValue !== event.oldValue) {
        refreshPresetsRef.current()
      }
      // Handle last active preset changes (for [Default] reset)
      if (event.key === 'pattern-generator-last-active-preset') {
        const lastActive = PresetManager.getLastActivePreset()
        setActivePresetId(lastActive)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also listen for custom events for same-window updates
    const handleCustomEvent = () => {
      refreshPresetsRef.current()
      // Also check if active preset should be cleared
      const lastActive = PresetManager.getLastActivePreset()
      setActivePresetId(lastActive)
    }
    
    window.addEventListener('preset-updated', handleCustomEvent)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('preset-updated', handleCustomEvent)
    }
  }, []) // No dependencies - stable event listeners

  // AIDEV-NOTE: Save current pattern parameters as new preset
  const savePreset = useCallback(async (name: string, description?: string): Promise<boolean> => {
    if (!name.trim()) {
      setError('Preset name cannot be empty')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const preset = PresetManager.createPreset(name, patternId, controlValues, description)
      const success = PresetManager.addPreset(preset)
      
      if (success) {
        // Update local state
        setPresets(prev => [...prev, preset])
        setActivePresetId(preset.id)
        PresetManager.setLastActivePreset(preset.id)
        
        // Notify other components about the preset update
        window.dispatchEvent(new CustomEvent('preset-updated'))
        
        return true
      } else {
        setError('Failed to save preset')
        return false
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save preset'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [patternId, controlValues])

  // AIDEV-NOTE: Load preset and update pattern controls
  const loadPreset = useCallback(async (presetId: string): Promise<boolean> => {
    const preset = presets.find(p => p.id === presetId)
    if (!preset) {
      setError('Preset not found')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // Validate preset parameters against current controls
      const validation = PresetManager.validatePresetParameters(preset, patternControls)
      
      if (!validation.valid && validation.warnings.length > 0) {
        console.warn('Preset validation warnings:', validation.warnings)
        // Continue loading but with warnings
      }

      // AIDEV-NOTE: Filter out parameters that no longer exist in current pattern
      const validParameters: Record<string, number | string | boolean> = {}
      const currentControlIds = new Set(patternControls.map(c => c.id))
      
      Object.entries(preset.parameters).forEach(([key, value]) => {
        if (currentControlIds.has(key)) {
          validParameters[key] = value
        }
      })

      // Update control values through existing state management
      onControlValuesChange(validParameters)
      
      // Update active preset tracking
      setActivePresetId(presetId)
      PresetManager.setLastActivePreset(presetId)
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load preset'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [presets, patternControls, onControlValuesChange])

  // AIDEV-NOTE: Delete preset from storage and update state
  const deletePreset = useCallback(async (presetId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const success = PresetManager.deletePreset(presetId)
      
      if (success) {
        setPresets(prev => prev.filter(p => p.id !== presetId))
        
        // Clear active preset if it was deleted
        if (activePresetId === presetId) {
          setActivePresetId(null)
        }
        
        // Notify other components about the preset update
        window.dispatchEvent(new CustomEvent('preset-updated'))
        
        return true
      } else {
        setError('Failed to delete preset')
        return false
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete preset'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [activePresetId])

  // AIDEV-NOTE: Rename existing preset
  const renamePreset = useCallback(async (presetId: string, newName: string): Promise<boolean> => {
    if (!newName.trim()) {
      setError('Preset name cannot be empty')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const success = PresetManager.updatePreset(presetId, { name: newName.trim() })
      
      if (success) {
        setPresets(prev => prev.map(p => 
          p.id === presetId ? { ...p, name: newName.trim() } : p
        ))
        
        // Notify other components about the preset update
        window.dispatchEvent(new CustomEvent('preset-updated'))
        
        return true
      } else {
        setError('Failed to rename preset')
        return false
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rename preset'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // AIDEV-NOTE: Validate specific preset against current pattern controls
  const validatePreset = useCallback((presetId: string) => {
    const preset = presets.find(p => p.id === presetId)
    if (!preset) {
      return { valid: false, warnings: ['Preset not found'] }
    }
    
    return PresetManager.validatePresetParameters(preset, patternControls)
  }, [presets, patternControls])

  // AIDEV-NOTE: Basic export functionality - single preset to JSON string
  const exportPreset = useCallback((presetId: string): string => {
    const preset = presets.find(p => p.id === presetId)
    if (!preset) {
      throw new Error('Preset not found')
    }
    
    const exportData = PresetManager.exportPresets([presetId])
    return JSON.stringify(exportData, null, 2)
  }, [presets])

  // AIDEV-NOTE: Enhanced import functionality with duplicate detection and detailed feedback
  const importPreset = useCallback(async (jsonData: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const exportData = JSON.parse(jsonData)
      const result = PresetManager.importPresets(exportData)
      const { importedIds, skippedDuplicates, errors } = result
      
      // Build user feedback message
      const feedbackParts: string[] = []
      
      if (importedIds.length > 0) {
        feedbackParts.push(`✓ Imported ${importedIds.length} preset${importedIds.length > 1 ? 's' : ''}`)
      }
      
      if (skippedDuplicates.length > 0) {
        feedbackParts.push(`⚠ Skipped ${skippedDuplicates.length} duplicate${skippedDuplicates.length > 1 ? 's' : ''}: ${skippedDuplicates.join(', ')}`)
      }
      
      if (errors.length > 0) {
        feedbackParts.push(`❌ Failed to import ${errors.length}: ${errors.join(', ')}`)
      }
      
      if (importedIds.length > 0) {
        // Reload presets to get fresh list including imports
        const updatedPresets = await PresetManager.getPresetsForGenerator(patternId)
        setPresets(updatedPresets)
        
        // AIDEV-NOTE: Auto-load the first imported preset for immediate feedback
        const firstImportedId = importedIds[0]
        const importedPreset = updatedPresets.find(p => p.id === firstImportedId)
        
        if (importedPreset) {
          // Validate and load the imported preset directly
          const validation = PresetManager.validatePresetParameters(importedPreset, patternControls)
          
          if (!validation.valid && validation.warnings.length > 0) {
            console.warn('Imported preset validation warnings:', validation.warnings)
          }

          // Filter out parameters that no longer exist in current pattern
          const validParameters: Record<string, number | string | boolean> = {}
          const currentControlIds = new Set(patternControls.map(c => c.id))
          
          Object.entries(importedPreset.parameters).forEach(([key, value]) => {
            if (currentControlIds.has(key)) {
              validParameters[key] = value
            }
          })

          // Update control values and set as active preset
          onControlValuesChange(validParameters)
          setActivePresetId(firstImportedId)
          PresetManager.setLastActivePreset(firstImportedId)
        }
        
        // Show success/info message if there were skips or errors
        if (skippedDuplicates.length > 0 || errors.length > 0) {
          console.info('Import summary:', feedbackParts.join(' | '))
        }
        
        return true
      } else {
        // No imports successful
        if (skippedDuplicates.length > 0) {
          setError(`All presets already exist: ${skippedDuplicates.join(', ')}`)
        } else {
          setError('No presets were imported')
        }
        return false
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import preset'
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [patternId, patternControls, onControlValuesChange])

  // AIDEV-NOTE: Clear error state
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // AIDEV-NOTE: Clear active preset and reset to pattern defaults
  const clearActivePreset = useCallback((): void => {
    // Clear active preset state
    setActivePresetId(null)
    PresetManager.clearLastActivePreset()
    
    // Reset all controls to their default values
    const defaultValues: Record<string, number | string | boolean> = {}
    patternControls.forEach(control => {
      defaultValues[control.id] = control.defaultValue
    })
    
    // Update control values through existing state management
    onControlValuesChange(defaultValues)
    
    // Notify other components about the preset change
    window.dispatchEvent(new CustomEvent('preset-updated'))
  }, [patternControls, onControlValuesChange])

  // AIDEV-NOTE: Restore factory presets functionality
  const restoreFactoryPresets = useCallback(async (): Promise<{ imported: number; skipped: number }> => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await PresetManager.restoreFactoryPresets()
      
      // Check if no presets were loaded (indicating an error)
      if (result.imported === 0 && result.skipped === 0) {
        setError('Failed to restore factory presets: Unable to load factory presets')
      }
      
      // Refresh the presets list to show newly imported factory presets
      refreshPresets()
      
      return result
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setError(`Failed to restore factory presets: ${errorMsg}`)
      return { imported: 0, skipped: 0 }
    } finally {
      setIsLoading(false)
    }
  }, [refreshPresets])

  return {
    // State
    presets,
    activePresetId,
    isLoading,
    error,
    
    // Operations
    savePreset,
    loadPreset,
    deletePreset,
    renamePreset,
    clearActivePreset,
    
    // Utilities
    refreshPresets,
    clearError,
    validatePreset,
    exportPreset,
    importPreset,
    restoreFactoryPresets
  }
}