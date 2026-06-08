// Carte générique réutilisable
interface CardProps { title: string; children: React.ReactNode; className?: string }

export default function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-5 ${className}`}>
      <h2 className="text-base font-semibold text-slate-700 mb-4">{title}</h2>
      {children}
    </div>
  )
}
