import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[40vh] flex items-center justify-center px-gutter">
          <div className="text-center">
            <p className="text-h2 font-medium text-on-surface mb-sm">Something went wrong</p>
            <p className="text-body-sm text-secondary mb-md">Please refresh the page or contact support.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="text-primary text-body-sm font-medium hover:underline cursor-pointer"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
