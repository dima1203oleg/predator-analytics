import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,68,68,0.1),transparent)]" />
          <div className="absolute inset-0 bg-cyber-grid opacity-5" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full relative z-10"
          >
            {/* Error Card */}
            <div className="bg-slate-900/60 backdrop-blur-xl border border-rose-500/20 rounded-[32px] p-12 shadow-2xl">
              {/* Icon */}
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center">
                    <AlertTriangle className="w-12 h-12 text-rose-400" />
                  </div>
                  <div className="absolute inset-0 w-24 h-24 rounded-full bg-rose-500/20 blur-xl animate-pulse" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl font-black text-white text-center mb-4 tracking-tight">
                Щось пішло не так
              </h1>

              {/* Description */}
              <p className="text-slate-400 text-center mb-8 leading-relaxed">
                Виникла неочікувана помилка. Не хвилюйтесь, ваші дані в безпеці.
                Спробуйте оновити сторінку або повернутися на головну.
              </p>

              {/* Error Details (Development) */}
              {import.meta.env.DEV && this.state.error && (
                <div className="mb-8 p-6 bg-black/40 border border-rose-500/10 rounded-2xl">
                  <h3 className="text-sm font-black text-rose-400 uppercase tracking-widest mb-3">
                    Технічні деталі
                  </h3>
                  <div className="space-y-2">
                    <div className="text-xs font-mono text-slate-400">
                      <span className="text-slate-600">Error:</span>{' '}
                      <span className="text-rose-300">{this.state.error.message}</span>
                    </div>
                    {this.state.error.stack && (
                      <details className="text-xs font-mono text-slate-500">
                        <summary className="cursor-pointer hover:text-slate-300 transition-colors">
                          Stack Trace
                        </summary>
                        <pre className="mt-2 p-4 bg-black/60 rounded-lg overflow-x-auto whitespace-pre-wrap text-[10px] leading-relaxed">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={this.handleReset}
                  className="group flex items-center gap-3 px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-600/20 hover:shadow-rose-500/30 hover:scale-105"
                >
                  <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                  <span>Спробувати знову</span>
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="group flex items-center gap-3 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-white/10 hover:border-white/20"
                >
                  <Home className="w-5 h-5" />
                  <span>На головну</span>
                </button>
              </div>

              {/* Help Text */}
              <p className="text-center text-xs text-slate-600 mt-8 font-mono">
                Якщо проблема повторюється, зверніться до служби підтримки
              </p>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl" />
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Lightweight Error Fallback for smaller components
export const ErrorFallback: React.FC<{ error?: Error; onReset?: () => void }> = ({
  error,
  onReset,
}) => (
  <div className="flex flex-col items-center justify-center p-8 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
    <AlertTriangle className="w-12 h-12 text-rose-400 mb-4" />
    <h3 className="text-lg font-bold text-white mb-2">Помилка завантаження</h3>
    <p className="text-sm text-slate-400 text-center mb-4">
      {error?.message || 'Не вдалося завантажити компонент'}
    </p>
    {onReset && (
      <button
        onClick={onReset}
        className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold rounded-lg transition-all"
      >
        <RefreshCw className="w-4 h-4" />
        Спробувати знову
      </button>
    )}
  </div>
);
