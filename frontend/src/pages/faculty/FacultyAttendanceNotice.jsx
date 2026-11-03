import { Link } from 'react-router-dom'
import { LockKeyhole } from 'lucide-react'

export default function FacultyAttendanceNotice() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <section className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <h1 className="font-display text-lg font-bold text-ink-900">Attendance is admin-managed</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Your class attendance is started automatically by the administrator’s Auto Mode setup.
          The system recognizes students during the 10-minute capture window and sends the report
          to the assigned faculty member when the window ends.
        </p>
        <Link to="/faculty" className="mt-5 inline-flex rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100">
          Back to dashboard
        </Link>
      </section>
    </div>
  )
}
