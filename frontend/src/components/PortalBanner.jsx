export default function PortalBanner({ icon: Icon, label, title, subtitle, badge, gradient, action }) {
  return (
    <div
      className="portal-banner relative overflow-hidden rounded-2xl px-6 py-5 sm:px-7 sm:py-6 text-white"
      style={{ background: gradient }}
    >
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          {Icon && (
            <div className="w-14 h-14 rounded-2xl bg-white/[0.17] ring-1 ring-white/10 flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6" strokeWidth={1.75} />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.15em] text-white/70 uppercase">{label}</p>
            <h1 className="font-display font-bold text-xl sm:text-[22px] mt-0.5 truncate">{title}</h1>
            {subtitle && <p className="text-xs sm:text-sm text-white/70 mt-0.5 truncate">{subtitle}</p>}
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-3 shrink-0">
          {action}
          {badge && (
          <span className="shrink-0 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-medium">
            {badge}
          </span>
          )}
        </div>
      </div>
      <div className="absolute -right-10 -bottom-16 w-48 h-48 rounded-full bg-white/[0.08]" />
      <div className="absolute right-14 -top-10 w-28 h-28 rounded-full bg-white/[0.08]" />
      <div className="absolute right-20 -bottom-7 w-20 h-20 rounded-full border border-white/[0.08]" />
    </div>
  )
}
