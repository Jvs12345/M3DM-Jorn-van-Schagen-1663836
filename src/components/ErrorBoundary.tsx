import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', background: '#0f172a', color: '#f1f5f9', minHeight: '100vh', fontFamily: 'sans-serif' }}>
                    <h1 style={{ color: '#ef4444' }}>Something went wrong.</h1>
                    <p>The application encountered a critical error and could not render.</p>
                    {this.state.error && (
                        <pre style={{
                            background: 'rgba(0,0,0,0.3)',
                            padding: '1rem',
                            borderRadius: '8px',
                            overflow: 'auto',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            {this.state.error.toString()}
                        </pre>
                    )}
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1.5rem',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        Reload Application
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
