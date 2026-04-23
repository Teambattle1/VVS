import { Component } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('VVS FLOW error:', error, info)

    // Chunk-load fejl = brugeren har gammel bundle-reference efter ny deploy.
    // Hard-reload een gang for at hente nye hashes. sessionStorage-flag stopper loop.
    const msg = String(error?.message || '')
    const isChunkError =
      /Failed to fetch dynamically imported module/i.test(msg) ||
      /Loading chunk [\d]+ failed/i.test(msg) ||
      /ChunkLoadError/i.test(msg)
    if (isChunkError && !sessionStorage.getItem('vvs-chunk-reload')) {
      sessionStorage.setItem('vvs-chunk-reload', '1')
      window.location.reload()
    }
  }

  handleReset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
          <div className="card p-6 md:p-8 max-w-md w-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7" strokeWidth={2} />
            </div>
            <h1 className="text-lg font-bold text-slate-900 mb-2">Noget gik galt</h1>
            <p className="text-sm text-slate-600 mb-4">
              Der opstod en uventet fejl. Prøv at genindlæse siden.
            </p>
            <pre className="text-[11px] bg-slate-100 rounded-xl p-3 mb-4 text-left overflow-auto max-h-32 text-rose-700">
              {this.state.error?.message || 'Ukendt fejl'}
            </pre>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="btn-secondary"
              >
                <RotateCcw className="w-4 h-4 text-slate-700" strokeWidth={2} />
                Prøv igen
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                Genindlæs
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
