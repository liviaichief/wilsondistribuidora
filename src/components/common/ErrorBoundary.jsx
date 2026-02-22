import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', color: '#ff4444', background: '#111', minHeight: '100vh', textAlign: 'center' }}>
                    <h1>Algo deu errado.</h1>
                    <p style={{ color: '#fff' }}>O aplicativo encontrou um erro inesperado.</p>
                    <div style={{ margin: '1rem', padding: '1rem', background: '#222', borderRadius: '4px', textAlign: 'left', overflow: 'auto' }}>
                        <p><strong>Erro:</strong> {this.state.error && this.state.error.toString()}</p>
                        <details style={{ marginTop: '1rem', color: '#888' }}>
                            <summary>Stack Trace</summary>
                            <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                        </details>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ padding: '10px 20px', background: '#D4AF37', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Recarregar Página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

