import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CheckWave UI Error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-navy-900 flex items-center justify-center p-6 text-white">
          <div className="max-w-md w-full bg-navy-800/90 border border-navy-700/80 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-md">
            <div className="w-16 h-16 rounded-2xl bg-danger-500/10 border border-danger-500/20 flex items-center justify-center mx-auto mb-5 text-danger-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm text-navy-400 mb-6">
              An unexpected error occurred in the monitoring interface. You can reload the page to restore your session.
            </p>
            {this.state.error?.message && (
              <div className="mb-6 p-3 rounded-lg bg-navy-900/80 border border-navy-700 text-xs font-mono text-danger-300 text-left overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <Button
              variant="primary"
              onClick={this.handleReload}
              className="w-full flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Reload CheckWave
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
