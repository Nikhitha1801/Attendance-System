import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CalendarClock, Camera, CheckCircle2, Clock, DoorOpen, MonitorPlay, Play, Users } from 'lucide-react'
import { getIpCameraFrame, getLiveSlots, startClassSession } from '../../api/endpoints'
import { LiveCapture } from '../faculty/TakeAttendance'

const CAPTURE_WINDOW_MINUTES = 10

function toUtcTimestamp(value) {
  if (!value) return Date.now()
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
  const timestamp = Date.parse(hasTimezone ? value : `${value}Z`)
  return Number.isFinite(timestamp) ? timestamp : Date.now()
}

export default function AdminAutoAttendance() {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [startingId, setStartingId] = useState(null)
  const [session, setSession] = useState(null)
  const [cameraUrl, setCameraUrl] = useState('')
  const [cameraConnected, setCameraConnected] = useState(false)
  const [connectingCamera, setConnectingCamera] = useState(false)

  const loadSlots = useCallback(() => {
    setLoading(true)
    getLiveSlots()
      .then(setSlots)
      .catch((err) => setError(err.response?.data?.detail || 'Could not load today’s timetable.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadSlots()
  }, [loadSlots])

  const startAutoAttendance = async (slot) => {
    setStartingId(slot.timetable_entry_id)
    setError(null)
    try {
      const started = await startClassSession(slot.timetable_entry_id)
      const startedAt = toUtcTimestamp(started.started_at)
      setSession({
        ...started,
        room: started.room || slot.room,
        ip_webcam_url: cameraConnected ? cameraUrl.trim() : null,
        autoCompleteAt: startedAt + CAPTURE_WINDOW_MINUTES * 60 * 1000,
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not start automatic attendance.')
      loadSlots()
    } finally {
      setStartingId(null)
    }
  }

  const connectCamera = async () => {
    const url = cameraUrl.trim()
    if (!url) return
    setConnectingCamera(true)
    setCameraConnected(false)
    setError(null)
    try {
      await getIpCameraFrame(url)
      setCameraConnected(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not connect to the IP camera. Check its URL and network access.')
    } finally {
      setConnectingCamera(false)
    }
  }

  if (session) {
    return (
      <LiveCapture
        session={session}
        autoCompleteAt={session.autoCompleteAt}
        allowEarlyStop
        onEnded={() => {
          setSession(null)
          loadSlots()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-900/10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <MonitorPlay className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/70">Administrator controls</p>
            <h1 className="font-display text-xl font-bold">Auto Attendance</h1>
            <p className="mt-1 text-xs text-white/75">Start a 10-minute recognition session and automatically email its report to the assigned faculty.</p>
          </div>
        </div>
        <Link to="/kiosk" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/15 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/25">
          <MonitorPlay className="h-4 w-4" /> Set up scheduled Auto Mode
        </Link>
      </header>

      <section className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="text-sm font-semibold text-blue-950">10-minute automatic capture</p>
            <p className="mt-1 text-xs leading-5 text-blue-800/80">
              Starting a class opens the camera immediately. Recognition continues automatically for 10 minutes;
              then unrecognized roster members are marked absent and the attendance report is emailed to the
              faculty assigned to that timetable slot. Keep this page open during capture.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <label htmlFor="admin-ip-camera" className="block text-sm font-semibold text-ink-900">Classroom camera</label>
        <p className="mt-1 text-xs text-slate-500">Use this device’s webcam, or connect an IP Webcam installed in the classroom.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            id="admin-ip-camera"
            type="url"
            value={cameraUrl}
            onChange={(event) => {
              setCameraUrl(event.target.value)
              setCameraConnected(false)
            }}
            placeholder="http://192.168.1.25:8080/shot.jpg"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          />
          <button
            type="button"
            onClick={connectCamera}
            disabled={!cameraUrl.trim() || connectingCamera}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <Camera className="h-4 w-4" /> {connectingCamera ? 'Connecting...' : cameraConnected ? 'Connected' : 'Connect'}
          </button>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="font-display text-[15px] font-semibold text-ink-900">Today’s timetable</h2>
          <p className="mt-1 text-xs text-slate-400">Only an administrator can start or resume attendance.</p>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Loading today’s classes...</p>
        ) : slots.length === 0 ? (
          <div className="py-10 text-center">
            <CalendarClock className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm font-medium text-slate-600">No classes scheduled today</p>
            <p className="mt-1 text-xs text-slate-400">Check the timetable or return on a scheduled class day.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {slots.map((slot) => {
              const completed = slot.existing_session_status === 'completed'
              const live = slot.existing_session_status === 'live'
              return (
                <article key={slot.timetable_entry_id} className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-sm text-ink-900">{slot.subject_name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        completed ? 'bg-emerald-100 text-emerald-700' : live ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {completed ? 'Completed' : live ? 'In progress' : slot.status === 'now' ? 'Class time now' : slot.status === 'upcoming' ? 'Upcoming' : 'Scheduled'}
                      </span>
                      {slot.is_swapped_in && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-700">Approved swap</span>}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {slot.start_time}–{slot.end_time}</span>
                      <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Section {slot.section}</span>
                      {slot.room && <span className="flex items-center gap-1.5"><DoorOpen className="h-3.5 w-3.5" /> {slot.room}</span>}
                      {slot.faculty_name && <span>Report to: {slot.faculty_name}</span>}
                    </div>
                  </div>
                  {completed ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 px-3 text-sm font-medium text-emerald-700">
                      <CheckCircle2 className="h-4 w-4" /> Report finalized
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startAutoAttendance(slot)}
                      disabled={startingId !== null}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
                    >
                      {startingId === slot.timetable_entry_id ? (
                        <><Camera className="h-4 w-4 animate-pulse" /> Starting...</>
                      ) : live ? (
                        <><Play className="h-4 w-4" /> Resume 10-min capture</>
                      ) : (
                        <><Play className="h-4 w-4" /> Start 10-min capture</>
                      )}
                    </button>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
