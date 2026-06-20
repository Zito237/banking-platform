import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        const { data } = await api.post('/auth/login', { username, password })
        login(data.token)
        navigate('/')
      } else {
        const { data } = await api.post('/auth/register', { username, email, password })
        login(data.token)
        navigate('/')
      }
    } catch (err: any) {
      const message = err.response?.data?.message
      if (typeof message === 'string') setError(message)
      else if (message && typeof message === 'object') setError(Object.values(message).join(' '))
      else setError('Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[55%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0f172a 0%, #1e3a5f 60%, #1e293b 100%)' }}
      >
        {/* Background decorative circles */}
        <div className="absolute top-[-80px] right-[-80px] w-[380px] h-[380px] rounded-full opacity-[0.06]"
             style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
        <div className="absolute bottom-[-60px] left-[-60px] w-[280px] h-[280px] rounded-full opacity-[0.08]"
             style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-900/50">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 20h20v2H2v-2zm2-8h2v7H4v-7zm5 0h2v7H9v-7zm4 0h2v7h-2v-7zm5 0h2v7h-2v-7zM2 7l10-5 10 5v2H2V7zm10-2.24L5.93 7h12.14L12 4.76z"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-none">FinPay</p>
            <p className="text-blue-300/70 text-xs font-medium tracking-wide mt-0.5">Banking Platform</p>
          </div>
        </div>

        {/* Main copy */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white leading-tight">
              La banque<br/>
              <span className="text-blue-400">nouvelle génération.</span>
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-sm">
              Gérez vos comptes, effectuez vos opérations et suivez vos prêts depuis une seule plateforme sécurisée.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {[
              { icon: '🔐', text: 'Authentification sécurisée JWT' },
              { icon: '💳', text: 'Gestion multi-comptes (Courant, Épargne, Portefeuille)' },
              { icon: '📊', text: 'Rapports et analyses en temps réel' },
              { icon: '🏦', text: 'Demandes de prêt et remboursement en ligne' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <span className="text-slate-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="relative z-10 text-slate-600 text-xs">
          © 2026 FinPay · Tous droits réservés · TP INF462
        </p>
      </div>

      {/* ── Right panel (form) ────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 20h20v2H2v-2zm2-8h2v7H4v-7zm5 0h2v7H9v-7zm4 0h2v7h-2v-7zm5 0h2v7h-2v-7zM2 7l10-5 10 5v2H2V7z"/>
              </svg>
            </div>
            <span className="font-bold text-slate-800 text-lg">FinPay</span>
          </div>

          {/* Tab switcher */}
          <div className="flex bg-white border border-slate-200 rounded-2xl p-1 mb-8 shadow-sm">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                  mode === m
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {m === 'login' ? 'Connexion' : 'Inscription'}
              </button>
            ))}
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {mode === 'login' ? 'Bon retour 👋' : 'Créer un compte'}
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              {mode === 'login'
                ? 'Connectez-vous pour accéder à votre espace.'
                : 'Remplissez les informations pour créer votre compte.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Nom d'utilisateur</label>
                <input
                  className="form-input"
                  placeholder="ex : jean_dupont"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              {mode === 'register' && (
                <div>
                  <label className="form-label">Adresse e-mail</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="jean@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              )}

              <div>
                <label className="form-label">Mot de passe</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
              </div>

              {error && (
                <div className="alert-error">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary btn-lg w-full mt-2 shadow-md shadow-blue-900/20"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Traitement…
                  </>
                ) : (
                  mode === 'login' ? 'Se connecter' : "Créer mon compte"
                )}
              </button>
            </form>
          </div>

          {/* Helper hint */}
          {mode === 'login' && (
            <p className="text-center text-xs text-slate-400 mt-4">
              Compte de démonstration : <span className="font-mono text-slate-600">admin / admin123</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
