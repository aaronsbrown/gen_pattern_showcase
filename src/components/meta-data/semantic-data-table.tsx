// AIDEV-NOTE: Data table component for displaying semantic metadata - Issue #44 Phase 5
'use client'

import React, { useState, useMemo } from 'react'
import type { RichPatternGeneratorDefinition } from '@/lib/semantic-types'
import { ChevronDown, ChevronRight, ExternalLink, Download, ChevronUp } from 'lucide-react'

interface SemanticDataTableProps {
  patterns: RichPatternGeneratorDefinition[]
}

type SortField = 'name' | 'category' | 'algorithm' | 'complexity' | 'status' | 'technology' | 'mobile'
type SortDirection = 'asc' | 'desc'

export default function SemanticDataTable({ patterns }: SemanticDataTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle between asc and desc
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedPatterns = useMemo(() => {

    return [...patterns].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'category':
          aValue = a.category.toLowerCase()
          bValue = b.category.toLowerCase()
          break
        case 'algorithm':
          aValue = a.semantics.primaryAlgorithmFamily.toLowerCase()
          bValue = b.semantics.primaryAlgorithmFamily.toLowerCase()
          break
        case 'complexity':
          // Order complexity levels properly
          const complexityOrder = { 'Low': 1, 'Medium': 2, 'High': 3, 'VeryHigh': 4 }
          aValue = complexityOrder[a.performance.computationalComplexity as keyof typeof complexityOrder] || 0
          bValue = complexityOrder[b.performance.computationalComplexity as keyof typeof complexityOrder] || 0
          break
        case 'status':
          // Order status properly
          const statusOrder = { 'Development': 1, 'Experimental': 2, 'Production': 3 }
          aValue = statusOrder[a.status as keyof typeof statusOrder] || 0
          bValue = statusOrder[b.status as keyof typeof statusOrder] || 0
          break
        case 'technology':
          aValue = a.technology.toLowerCase()
          bValue = b.technology.toLowerCase()
          break
        case 'mobile':
          // Calculate mobile friendliness
          const getMobileFriendliness = (pattern: RichPatternGeneratorDefinition) => {
            const hasMobileIssues = pattern.controls?.some(c => 
              'defaultRecommendations' in c && 
              c.defaultRecommendations?.platformSpecific?.mobile === false
            )
            const isMobileFriendly = pattern.performance.computationalComplexity !== 'VeryHigh' && !hasMobileIssues
            return isMobileFriendly ? 1 : 0
          }
          aValue = getMobileFriendliness(a)
          bValue = getMobileFriendliness(b)
          break
        default:
          return 0
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      } else {
        return sortDirection === 'asc' 
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number)
      }
    })
  }, [patterns, sortField, sortDirection])

  const toggleRow = (patternId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(patternId)) {
      newExpanded.delete(patternId)
    } else {
      newExpanded.add(patternId)
    }
    setExpandedRows(newExpanded)
  }

  const renderSortIcon = (field: SortField) => {
    return sortField === field ? (
      sortDirection === 'asc' 
        ? <ChevronDown className="w-3 h-3" />
        : <ChevronUp className="w-3 h-3" />
    ) : (
      <div className="w-3 h-3" /> // Invisible spacer to maintain width
    )
  }

  const SortableHeader = ({ field, children, className = '' }: { 
    field: SortField
    children: React.ReactNode
    className?: string 
  }) => (
    <th 
      className={`px-4 py-3 text-left font-mono text-xs uppercase tracking-wide text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {renderSortIcon(field)}
      </div>
    </th>
  )

  const exportData = () => {
    const data = sortedPatterns.map(pattern => ({
      id: pattern.id,
      name: pattern.name,
      category: pattern.category,
      technology: pattern.technology,
      algorithmFamily: pattern.semantics.primaryAlgorithmFamily,
      complexity: pattern.performance.computationalComplexity,
      status: pattern.status,
      version: pattern.version,
      mathConcepts: pattern.semantics.keyMathematicalConcepts.join(', '),
      visualCharacteristics: pattern.semantics.visualCharacteristics.join(', '),
      keywords: pattern.semantics.keywords.join(', '),
      frameRateTarget: pattern.performance.typicalFrameRateTarget,
      optimizations: pattern.performance.optimizationsUsed?.join(', ') || 'None',
      isInteractive: pattern.isInteractive ? 'Yes' : 'No',
      author: pattern.author,
      dateAdded: pattern.dateAdded,
      lastModified: pattern.lastModified
    }))

    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).map(v => `"${v}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `semantic-metadata-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Low': return 'text-green-500'
      case 'Medium': return 'text-yellow-500'
      case 'High': return 'text-orange-500'
      case 'VeryHigh': return 'text-red-500'
      default: return 'text-muted-foreground'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Production': return 'text-green-500'
      case 'Experimental': return 'text-yellow-500'
      case 'Development': return 'text-orange-500'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background/50">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-border bg-background/70 flex justify-between items-center">
        <h2 className="text-lg font-mono font-semibold uppercase tracking-wider text-accent-primary-strong">
          Pattern Data ({sortedPatterns.length} results)
        </h2>
        <button
          onClick={exportData}
          className="flex items-center gap-2 px-4 py-2 bg-accent-primary-strong text-background font-mono text-xs uppercase tracking-wide rounded hover:bg-accent-primary transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-background/30">
              <SortableHeader field="name">
                Pattern
              </SortableHeader>
              <SortableHeader field="category">
                Category
              </SortableHeader>
              <SortableHeader field="algorithm">
                Algorithm
              </SortableHeader>
              <SortableHeader field="complexity">
                Complexity
              </SortableHeader>
              <SortableHeader field="status">
                Status
              </SortableHeader>
              <SortableHeader field="technology">
                Tech
              </SortableHeader>
              <SortableHeader field="mobile" className="text-center">
                Mobile
              </SortableHeader>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {sortedPatterns.map((pattern) => {
              const isExpanded = expandedRows.has(pattern.id)
              const hasMobileIssues = pattern.controls?.some(c => 
                'defaultRecommendations' in c && 
                c.defaultRecommendations?.platformSpecific?.mobile === false
              )
              const isMobileFriendly = pattern.performance.computationalComplexity !== 'VeryHigh' && !hasMobileIssues

              return (
                <React.Fragment key={pattern.id}>
                  <tr className="border-b border-border/50 hover:bg-background/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono text-sm font-medium">{pattern.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{pattern.id}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{pattern.category}</td>
                    <td className="px-4 py-3 font-mono text-sm">{pattern.semantics.primaryAlgorithmFamily}</td>
                    <td className={`px-4 py-3 font-mono text-sm ${getComplexityColor(pattern.performance.computationalComplexity)}`}>
                      {pattern.performance.computationalComplexity}
                    </td>
                    <td className={`px-4 py-3 font-mono text-sm ${getStatusColor(pattern.status)}`}>
                      {pattern.status}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs uppercase">{pattern.technology}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${isMobileFriendly ? 'bg-green-500' : 'bg-red-500'}`} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleRow(pattern.id)}
                        className="p-1 hover:bg-background rounded transition-colors"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Details */}
                  {isExpanded && (
                    <tr className="bg-background/30">
                      <td colSpan={8} className="px-8 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Description */}
                          <div>
                            <h3 className="font-mono text-xs uppercase tracking-wide text-muted-foreground mb-2">
                              Description
                            </h3>
                            <p className="text-sm">{pattern.description}</p>
                            {pattern.longDescription && (
                              <p className="text-sm text-muted-foreground mt-2">{pattern.longDescription}</p>
                            )}
                          </div>

                          {/* Mathematical Concepts */}
                          <div>
                            <h3 className="font-mono text-xs uppercase tracking-wide text-muted-foreground mb-2">
                              Mathematical Concepts
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {pattern.semantics.keyMathematicalConcepts.map(concept => (
                                <span key={concept} className="px-2 py-1 bg-background border border-border rounded text-xs font-mono">
                                  {concept}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Visual Characteristics */}
                          <div>
                            <h3 className="font-mono text-xs uppercase tracking-wide text-muted-foreground mb-2">
                              Visual Characteristics
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {pattern.semantics.visualCharacteristics.map(char => (
                                <span key={char} className="px-2 py-1 bg-background border border-border rounded text-xs font-mono">
                                  {char}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Performance Profile */}
                          <div>
                            <h3 className="font-mono text-xs uppercase tracking-wide text-muted-foreground mb-2">
                              Performance Profile
                            </h3>
                            <div className="space-y-1 text-sm font-mono">
                              <div>Target FPS: {pattern.performance.typicalFrameRateTarget}</div>
                              <div>Complexity: {pattern.performance.computationalComplexity}</div>
                              {pattern.performance.optimizationsUsed && (
                                <div>Optimizations: {pattern.performance.optimizationsUsed.join(', ')}</div>
                              )}
                              {pattern.performance.notes && (
                                <div className="text-xs text-muted-foreground mt-2">{pattern.performance.notes}</div>
                              )}
                            </div>
                          </div>

                          {/* Educational Links */}
                          {pattern.educationalLinks && pattern.educationalLinks.length > 0 && (
                            <div>
                              <h3 className="font-mono text-xs uppercase tracking-wide text-muted-foreground mb-2">
                                Educational Resources
                              </h3>
                              <div className="space-y-1">
                                {pattern.educationalLinks.map((link, i) => (
                                  <a
                                    key={i}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-sm text-accent-primary hover:underline"
                                  >
                                    {link.title}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Metadata */}
                          <div>
                            <h3 className="font-mono text-xs uppercase tracking-wide text-muted-foreground mb-2">
                              Metadata
                            </h3>
                            <div className="space-y-1 text-sm font-mono">
                              <div>Version: {pattern.version}</div>
                              <div>Author: {pattern.author}</div>
                              <div>Added: {pattern.dateAdded}</div>
                              <div>Modified: {pattern.lastModified}</div>
                            </div>
                          </div>

                          {/* Control Summary */}
                          {pattern.controls && pattern.controls.length > 0 && (
                            <div className="md:col-span-2">
                              <h3 className="font-mono text-xs uppercase tracking-wide text-muted-foreground mb-2">
                                Controls ({pattern.controls.length})
                              </h3>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {pattern.controls.map(control => {
                                  const hasRecommendations = 'defaultRecommendations' in control && control.defaultRecommendations
                                  return (
                                    <div key={control.id} className="border border-border/50 rounded p-2 text-xs font-mono">
                                      <div className="font-medium">{control.label}</div>
                                      {'impactsPerformance' in control && (
                                        <div className={`text-xs ${
                                          control.impactsPerformance === 'Significant' ? 'text-red-500' :
                                          control.impactsPerformance === 'Moderate' ? 'text-orange-500' :
                                          'text-muted-foreground'
                                        }`}>
                                          Impact: {control.impactsPerformance}
                                        </div>
                                      )}
                                      {hasRecommendations && (
                                        <div className="text-xs text-accent-primary mt-1">Has recommendations</div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {sortedPatterns.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-muted-foreground font-mono">No patterns match the current filters</p>
        </div>
      )}
    </div>
  )
}