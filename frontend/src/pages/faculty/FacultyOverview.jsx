import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, MapPin, ArrowRight, GraduationCap, CalendarDays, ClipboardList, BarChart3, CheckCircle2, LockKeyhole } from 'lucide-react'
import { getFacultyDashboard } from '../../api/endpoints'
import PortalBanner from '../../components/PortalBanner'
import StatCard from '../../components/StatCard'
import { useAuth } from '../../context/AuthContext'

export default function FacultyOverview() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getFacultyDashboard()
      .then(setData)
      .catch(() => setError('Could not load dashboard data.'))
  }, [])

  const latestSession = data?.recent_sessions[0]
  const latestAttendance = latestSession?.total
    ? Math.round((latestSession.present / latestSession.total) * 100)
    : null

  return (
    <div className="space-y-5">
      <PortalBanner
        icon={GraduationCap}
        label="Faculty Portal"
        title={user.name}
        subtitle={`${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} · GSSSIETW`}
        gradient="linear-gradient(110deg, #087b71 0%, #079b89 45%, #2871dc 100%)"
      />

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {!data && !error && <p className="text-slate-500 text-sm">Loading...</p>}

      {data && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Today's Lectures" value={data.today_classes.length} icon={CalendarDays} accent="#4384f4" />
            <StatCard label="Recent Sessions" value={data.recent_sessions.length} icon={ClipboardList} accent="#16b981" />
            <StatCard
              label="Latest Attendance"
              value={latestAttendance === null ? '—' : latestAttendance}
              suffix={latestAttendance === null ? '' : '%'}
              icon={BarChart3}
              accent="#e7a523"
            />
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-4">
              <h2 className="font-display font-semibold text-[15px] text-ink-900">Today’s Schedule</h2>
              <p className="text-xs text-slate-400 mt-1">Your classes for today</p>
            </div>
            {data.today_classes.length === 0 ? (
              <div className="min-h-[250px] flex flex-col items-center justify-center text-center">
                <div className="w-11 h-11 rounded-full border-[3px] border-slate-200 text-slate-300 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-slate-600">No classes today</p>
                <p className="text-xs text-slate-400 mt-1">Enjoy your free day!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {data.today_classes.map((c) => (
                  <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 first:pt-1 last:pb-1">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <CalendarDays className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-display font-semibold text-sm text-ink-900">{c.subject}</p>
                        <p className="text-xs text-slate-500 mt-1">Section {c.section}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {c.start_time} – {c.end_time}</span>
                          <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {c.room || 'Room not set'}</span>
                        </div>
                      </div>
                    </div>
                    <span className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-500">
                      <LockKeyhole className="w-3.5 h-3.5" /> Started by admin
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-semibold text-[15px] text-ink-900">Recent Sessions</h2>
                <p className="text-xs text-slate-400 mt-1">Latest attendance records</p>
              </div>
              <Link to="/faculty/reports" className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1">
                View Reports <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {data.recent_sessions.length === 0 ? (
              <p className="text-slate-500 text-sm py-3">No attendance taken yet.</p>
            ) : (
              <div className="space-y-2">
                {data.recent_sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">{s.subject}</p>
                      <p className="text-xs text-slate-400 mt-0.5">Section {s.section} · {s.date}</p>
                    </div>
                    <p className="text-sm font-semibold text-ink-900 whitespace-nowrap">
                      {s.present}/{s.total} <span className="text-slate-400 font-normal">present</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="mb-4">
              <h2 className="font-display font-semibold text-[15px] text-ink-900">Student Attendance This Week</h2>
              <p className="mt-1 text-xs text-slate-400">
                {data.attendance_week
                  ? `${data.attendance_week.start} to ${data.attendance_week.end} · records below 85% are highlighted`
                  : 'Weekly attendance summary'}
              </p>
            </div>
            {!data.attendance_week ? (
              <p className="py-8 text-center text-sm text-amber-700">
                Weekly attendance is unavailable from the running API. Restart the backend to load the latest dashboard data.
              </p>
            ) : data.attendance_week.students.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No student attendance recorded in your classes this week.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-3 py-3 font-medium">Student</th>
                      <th className="px-3 py-3 font-medium">Roll No</th>
                      <th className="px-3 py-3 font-medium">Section</th>
                      <th className="px-3 py-3 font-medium">Present</th>
                      <th className="px-3 py-3 text-right font-medium">Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.attendance_week.students.map((student) => {
                      const belowThreshold = student.percentage < 85
                      return (
                        <tr
                          key={student.student_id}
                          className={`border-b last:border-0 ${belowThreshold ? 'border-red-100 bg-red-50 text-red-800' : 'border-slate-100'}`}
                        >
                          <td className="px-3 py-3 font-medium">{student.name}</td>
                          <td className="px-3 py-3">{student.roll_no}</td>
                          <td className="px-3 py-3">{student.section}</td>
                          <td className="px-3 py-3">{student.present}/{student.total}</td>
                          <td className={`px-3 py-3 text-right font-semibold ${belowThreshold ? 'text-red-700' : 'text-emerald-700'}`}>
                            {student.percentage}%
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
