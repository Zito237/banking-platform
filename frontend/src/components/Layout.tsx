// Mise en page principale avec barre latérale
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface NavItem { label: string; to: string }

const clientLinks: NavItem[] = [
  { label: 'Comptes', to: '/comptes' },
  { label: 'Dépôt', to: '/depot' },
  { label: 'Retrait', to: '/retrait' },
  { label: 'Transfert', to: '/transfert' },
  { label: 'Prêts', to: '/prets' },
  { label: 'Documents', to: '/documents' },
  { label: 'Notifications', to: '/notifications' },
]

const operatorLinks: NavItem[] = [
  { label: 'Demandes de prêt', to: '/demandes-pret' },
  { label: 'Rapports', to: '/rapports' },
]

const adminLinks: NavItem[] = [
  { label: 'Opérateurs', to: '/operateurs' },
  { label: 'Audit', to: '/audit' },
  { label: 'Rapports', to: '/rapports-admin' },
]

export default function Layout() {
  const { user, logout } = useAuth()

  const links =
    user?.role === 'CLIENT' ? clientLinks :
    user?.role === 'OPERATOR' ? operatorLinks :
    adminLinks

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Barre latérale */}
      <aside className="w-56 bg-white border-r border-slate-100 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-100">
          <span className="font-bold text-blue-600 text-lg">Banking</span>
          <p className="text-xs text-slate-400 mt-0.5">{user?.username} · {user?.role}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm transition ${
                  isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={logout}
          className="m-3 text-sm text-slate-400 hover:text-red-500 transition text-left px-3 py-2"
        >
          Déconnexion
        </button>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
