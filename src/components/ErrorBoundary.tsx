import React, { Component, ErrorInfo, ReactNode } from 'react';
import { OfficialEmblem } from './OfficialEmblem';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleRecover = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl">
            <div className="flex justify-center">
              <OfficialEmblem size={56} glow={true} />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Sessió Protegida</span>
              </div>
              <h2 className="text-xl font-black text-white">
                S'ha detectat un petit problema visual
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                El teu progrés, dades i entrenaments actius estan desats de forma segura a la memòria local del dispositiu.
              </p>
            </div>

            <button
              type="button"
              onClick={this.handleRecover}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reprendre i recarregar la sessió</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
