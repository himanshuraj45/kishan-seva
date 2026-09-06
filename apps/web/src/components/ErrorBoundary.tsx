/**
 * KisanSeva — React Error Boundary
 * Catches JavaScript errors in child component trees and shows a friendly fallback UI.
 *
 * @example
 * <ErrorBoundary fallbackMessage="Failed to load market data">
 *   <MarketComponent />
 * </ErrorBoundary>
 */
'use client'
import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallbackMessage?: string
  onError?: (error: Error, info: ErrorInfo) => void
}
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false } }
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error } }
  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[KisanSeva ErrorBoundary]', error, info)
    this.props.onError?.(error, info)
  }
  handleReset = () => this.setState({ hasError: false, error: undefined })
  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div role="alert" style={{ margin: 24, padding: 24, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>⚠️</div>
        <h3 style={{ color: '#991b1b', fontWeight: 700, margin: '0 0 8px' }}>
          {this.props.fallbackMessage ?? 'Something went wrong'}
        </h3>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: '0 0 16px' }}>
          {this.state.error?.message ?? 'An unexpected error occurred.'}
        </p>
        <button onClick={this.handleReset} style={{ background: '#166534', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 700, cursor: 'pointer' }}>
          Try Again
        </button>
      </div>
    )
  }
}
export default ErrorBoundary
