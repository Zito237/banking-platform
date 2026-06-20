import { ReactNode } from 'react'

interface CardProps {
  title?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  noPad?: boolean
}

export default function Card({ title, subtitle, action, children, className = '', noPad = false }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
          <div>
            {title && <h2 className="text-sm font-semibold text-slate-800">{title}</h2>}
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="ml-4 shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPad ? '' : 'px-6 py-5'}>
        {children}
      </div>
    </div>
  )
}
