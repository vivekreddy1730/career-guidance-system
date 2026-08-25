import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
          <h5 className="fw-700 mb-2">Something went wrong</h5>
          <p className="text-muted-dark mb-4">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            className="btn-brand btn"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
