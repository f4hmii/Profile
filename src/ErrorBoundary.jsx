import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{color: 'white', zIndex: 9999, position: 'absolute', top: 0, left: 0, padding: '20px', backgroundColor: 'red', width: '100%', boxSizing: 'border-box'}}>
          <h3>Something went wrong in the Canvas.</h3>
          <pre style={{whiteSpace: 'pre-wrap'}}>{this.state.error.toString()}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
