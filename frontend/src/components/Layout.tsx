import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

/* ── Inline SVG icons ─────────────────────────────── */
const Ico = {
  profile:  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0"/></svg>,
  accounts: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2.5"/><path strokeLinecap="round" d="M2 10h20"/></svg>,
  deposit:  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>,
  withdraw: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>,
  transfer: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/></svg>,
  history:  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  loans:    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33"/></svg>,
  repay:    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>,
  docs:     <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>,
  bell:     <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>,
  operators:<svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg>,
  users:    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>,
  kyc:      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>,
  audit:    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>,
  reports:  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>,
  services: <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z"/></svg>,
  loanreq:  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m0-15.75H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>,
  logout:   <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"/></svg>,
}

/* ── Nav structure ────────────────────────────────── */
interface NavItem  { label: string; to: string; icon: keyof typeof Ico; notif?: boolean }
interface NavGroup { label: string; items: NavItem[] }

const clientGroups: NavGroup[] = [
  { label: 'Mon espace', items: [
    { label: 'Mon profil',     to: '/profil',        icon: 'profile'   },
    { label: 'Comptes',        to: '/comptes',        icon: 'accounts'  },
    { label: 'Notifications',  to: '/notifications',  icon: 'bell', notif: true },
  ]},
  { label: 'Opérations', items: [
    { label: 'Dépôt',          to: '/depot',          icon: 'deposit'   },
    { label: 'Retrait',        to: '/retrait',        icon: 'withdraw'  },
    { label: 'Transfert',      to: '/transfert',      icon: 'transfer'  },
    { label: 'Historique',     to: '/historique',     icon: 'history'   },
  ]},
  { label: 'Crédit', items: [
    { label: 'Prêts',          to: '/prets',          icon: 'loans'     },
    { label: 'Remboursement',  to: '/remboursement',  icon: 'repay'     },
    { label: 'Documents KYC',  to: '/documents',      icon: 'docs'      },
  ]},
]

const adminGroups: NavGroup[] = [
  { label: 'Gestion', items: [
    { label: 'Opérateurs',     to: '/operateurs',    icon: 'operators' },
    { label: 'Utilisateurs',   to: '/utilisateurs',  icon: 'users'     },
    { label: 'Comptes',        to: '/comptes-admin', icon: 'accounts'  },
  ]},
  { label: 'Conformité', items: [
    { label: 'Documents KYC',  to: '/documents-kyc', icon: 'kyc'       },
    { label: 'Audit',          to: '/audit',         icon: 'audit'     },
  ]},
  { label: 'Analytique', items: [
    { label: 'Rapports',       to: '/rapports-admin',icon: 'reports'   },
    { label: 'Services',       to: '/services',      icon: 'services'  },
  ]},
]

const operatorGroups: NavGroup[] = [
  { label: 'Gestion', items: [
    { label: 'Demandes de prêt', to: '/demandes-pret', icon: 'loanreq' },
  ]},
  { label: 'Analytique', items: [
    { label: 'Rapports',  to: '/rapports',  icon: 'reports'  },
    { label: 'Services',  to: '/services',  icon: 'services' },
  ]},
]

const ROLE_COLORS: Record<string, string> = {
  ADMIN:    'bg-violet-500/20 text-violet-300',
  OPERATOR: 'bg-blue-500/20 text-blue-300',
  CLIENT:   'bg-emerald-500/20 text-emerald-300',
}

const AVATAR_COLORS = ['bg-blue-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-cyan-500']
function avatarColor(name: string) {
  return AVATAR_COLORS[(name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]
}

/* ── Component ────────────────────────────────────── */
export default function Layout() {
  const { user, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const customerIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (user?.role !== 'CLIENT') return
    async function fetchCount() {
      try {
        if (!customerIdRef.current) {
          const { data: me } = await api.get('/auth/me')
          customerIdRef.current = me.linkedCustomerId ?? null
        }
        if (!customerIdRef.current) return
        const { data } = await api.get('/customers/notifications', {
          params: { customerId: customerIdRef.current },
        })
        setUnreadCount((data as { read: boolean }[]).filter((n) => !n.read).length)
      } catch { /* silently ignore */ }
    }
    fetchCount()
    const id = setInterval(fetchCount, 30_000)
    return () => clearInterval(id)
  }, [user?.role])

  function handleNotifClick() { setUnreadCount(0) }

  const groups =
    user?.role === 'CLIENT'   ? clientGroups   :
    user?.role === 'OPERATOR' ? operatorGroups :
    adminGroups

  const initial = (user?.username ?? '?')[0].toUpperCase()
  const roleTag = ROLE_COLORS[user?.role ?? ''] ?? 'bg-slate-500/20 text-slate-300'

  return (
    <div className="flex min-h-screen bg-slate-100">

      {/* ── Sidebar ───────────────────────────────── */}
      <aside className="w-64 shrink-0 flex flex-col"
        style={{ background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)' }}>

        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-900/40">
              <svg className="w-4.5 h-4.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.5 2C6.26 2 2 6.26 2 11.5S6.26 21 11.5 21c1.4 0 2.73-.29 3.95-.82l4.16 4.16 1.41-1.41-4.16-4.16A9.46 9.46 0 0021 11.5C21 6.26 16.74 2 11.5 2zM11.5 19C7.36 19 4 15.64 4 11.5S7.36 4 11.5 4 19 7.36 19 11.5 15.64 19 11.5 19zM14 10h-2V8h-1v2H9v1h2v2h1v-2h2v-1z"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">FinPay</p>
              <p className="text-slate-400 text-[10px] mt-0.5 font-medium tracking-wide">BANKING PLATFORM</p>
            </div>
          </div>
        </div>

        {/* User */}
        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-3 px-2 py-2.5 rounded-xl bg-white/5">
            <div className={`w-8 h-8 rounded-lg ${avatarColor(user?.username ?? 'A')} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.username}</p>
              <span className={`inline-block mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${roleTag}`}>
                {user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 select-none">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={item.notif ? handleNotifClick : undefined}
                    className={({ isActive }) =>
                      `flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                          : 'text-slate-400 hover:text-white hover:bg-white/8'
                      }`
                    }
                    style={({ isActive }) =>
                      !isActive ? undefined : { boxShadow: '0 2px 12px rgba(37,99,235,0.35)' }
                    }
                  >
                    <span className="flex items-center gap-2.5">
                      {Ico[item.icon]}
                      {item.label}
                    </span>
                    {item.notif && unreadCount > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm shadow-rose-900/40">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-white/5">
          <button
            onClick={logout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-150"
          >
            {Ico.logout}
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────── */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-7xl mx-auto fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
