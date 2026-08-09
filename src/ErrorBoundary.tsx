import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%', 
          width: '100%', 
          color: '#94a3b8', 
          textAlign: 'center',
          padding: '20px'
        }}>
          <div>
            <p style={{ fontSize: '1.2rem', marginBottom: '10px' }}>3D Lanyard Experience Unavailable</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Your browser or device might not support WebGL.</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
