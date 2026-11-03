export default function StatCard({ label, value, icon: Icon, accent = '#5b7cfa', suffix = '' }) {
  return (
    <div className="stat-card relative rounded-2xl border border-slate-200/80 bg-white p-5 overflow-hidden">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold tracking-[0.045em] text-slate-500 uppercase">{label}</p>
        {Icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${accent}18`, color: accent }}
          >
            <Icon className="w-[18px] h-[18px]" strokeWidth={1.8} />
          </div>
        )}
      </div>
      <p className="text-[30px] font-display font-bold text-ink-900 mt-2 leading-none">
        {value === null || value === undefined ? '—' : value}
        {suffix}
      </p>
      <div className="absolute bottom-0 left-0 w-12 h-[3px] rounded-r-full" style={{ background: accent }} />
    </div>
  )
}
