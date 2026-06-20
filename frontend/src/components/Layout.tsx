import { NavLink, Outlet } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

interface NavItem { label: string; to: string }

const clientLinks: NavItem[] = [
  { label: 'Mon profil',     to: '/profil'         },
  { label: 'Comptes',        to: '/comptes'         },
  { label: 'Dépôt',          to: '/depot'           },
  { label: 'Retrait',        to: '/retrait'         },
  { label: 'Transfert',      to: '/transfert'       },
  { label: 'Historique',     to: '/historique'      },
  { label: 'Prêts',          to: '/prets'           },
  { label: 'Remboursement',  to: '/remboursement'   },
  { label: 'Documents',      to: '/documents'       },
  { label: 'Notifications',  to: '/notifications'   },
]

const adminLinks: NavItem[] = [
  { label: 'Opérateurs',         to: '/operateurs'    },
  { label: 'Utilisateurs',       to: '/utilisateurs'  },
  { label: 'Comptes',            to: '/comptes-admin' },
  { label: 'Documents KYC',      to: '/documents-kyc' },
  { label: 'Audit',              to: '/audit'         },
  { label: 'Rapports',           to: '/rapports-admin'},
  { label: 'Statut des services',to: '/services'      },
]

const operatorLinks: NavItem[] = [
  { label: 'Demandes de prêt',   to: '/demandes-pret' },
  { label: 'Rapports',           to: '/rapports'      },
  { label: 'Statut des services',to: '/services'      },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const customerIdRef = useRef<string | null>(null)

  // Poll unread notification count every 30 s (CLIENT only)
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

  // Reset badge when user navigates to /notifications
  function handleNotifClick() {
    setUnreadCount(0)
  }

  const links =
    user?.role === 'CLIENT'   ? clientLinks   :
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
              onClick={l.to === '/notifications' ? handleNotifClick : undefined}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${
                  isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <span>{l.label}</span>
              {l.to === '/notifications' && unreadCount > 0 && (
                <span className="ml-1 bg-blue-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
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
