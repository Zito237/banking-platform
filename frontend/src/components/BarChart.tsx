interface BarItem { label: string; value: number; color?: string }

interface Props {
  data: BarItem[]
  unit?: string
  height?: number
}

export default function BarChart({ data, unit = '', height = 120 }: Props) {
  if (!data.length) return <p className="text-xs text-slate-400 text-center py-4">Aucune donnée</p>

  const max = Math.max(...data.map((d) => d.value), 1)

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-end gap-2 min-w-0" style={{ height }}>
        {data.map((item) => {
          const pct = Math.round((item.value / max) * 100)
          return (
            <div key={item.label} className="flex flex-col items-center flex-1 min-w-0 h-full justify-end">
              <p className="text-[9px] text-slate-500 mb-0.5 text-center leading-tight">
                {item.value > 0 ? (item.value >= 1000 ? `${(item.value / 1000).toFixed(0)}k` : item.value.toString()) : ''}
              </p>
              <div
                className="w-full rounded-t-md transition-all"
                style={{ height: `${Math.max(pct, item.value > 0 ? 4 : 0)}%`, backgroundColor: item.color ?? '#3b82f6' }}
              />
              <p className="text-[9px] text-slate-400 mt-1 text-center leading-tight truncate w-full px-0.5">
                {item.label}
              </p>
            </div>
          )
        })}
      </div>
      {unit && <p className="text-[10px] text-slate-400 text-right mt-1">{unit}</p>}
    </div>
  )
}
