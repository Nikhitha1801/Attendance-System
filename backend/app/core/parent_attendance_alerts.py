import logging
from datetime import date, datetime, timedelta

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .. import models
from . import email_utils

logger = logging.getLogger("attendify.parent_alerts")
ATTENDANCE_THRESHOLD = 85
MAX_ATTEMPTS = 3


def is_configured() -> bool:
    return email_utils.is_configured()


def _claim_alert(
    db: Session,
    student_id: int,
    week_start: date,
    now: datetime,
) -> models.ParentAttendanceAlert | None:
    alert = (
        db.query(models.ParentAttendanceAlert)
        .filter(
            models.ParentAttendanceAlert.student_id == student_id,
            models.ParentAttendanceAlert.week_start == week_start,
        )
        .first()
    )
    if alert and alert.status == "sent":
        return None
    if alert and alert.attempts >= MAX_ATTEMPTS:
        return None
    if alert and alert.last_attempt_at:
        if alert.status == "sending" and alert.last_attempt_at > now - timedelta(minutes=30):
            return None
        if alert.status == "failed" and alert.last_attempt_at > now - timedelta(hours=1):
            return None

    if alert is None:
        alert = models.ParentAttendanceAlert(
            student_id=student_id,
            week_start=week_start,
            status="sending",
            attempts=1,
            last_attempt_at=now,
        )
        db.add(alert)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            return None
    else:
        alert.status = "sending"
        alert.attempts += 1
        alert.last_attempt_at = now
        db.commit()

    return alert


def send_weekly_parent_warnings(
    db: Session,
    week_start: date,
    week_end: date,
) -> None:
    if not is_configured():
        logger.warning("SMTP is not configured; weekly parent attendance emails are not being sent")
        return

    records = (
        db.query(models.AttendanceRecord)
        .join(models.AttendanceSession)
        .join(models.StudentProfile)
        .filter(
            models.AttendanceSession.session_date >= week_start,
            models.AttendanceSession.session_date <= week_end,
        )
        .all()
    )
    attendance = {}
    for record in records:
        student = record.student
        counts = attendance.setdefault(student.id, {
            "profile": student,
            "present": 0,
            "total": 0,
        })
        counts["total"] += 1
        if record.status == models.AttendanceStatus.present:
            counts["present"] += 1

    for student_id, counts in attendance.items():
        profile = counts["profile"]
        percentage = counts["present"] / counts["total"] * 100
        if percentage >= ATTENDANCE_THRESHOLD:
            continue
        if not profile.parent_name or not profile.parent_email:
            logger.warning(
                "Skipping parent attendance warning for student profile %s: parent contact is incomplete",
                student_id,
            )
            continue

        alert = _claim_alert(db, student_id, week_start, datetime.utcnow())
        if alert is None:
            continue

        if not email_utils.send_parent_attendance_warning(
            to_email=profile.parent_email,
            parent_name=profile.parent_name,
            student_name=profile.user.name,
            percentage=round(percentage, 1),
            week_start=week_start.isoformat(),
            week_end=week_end.isoformat(),
        ):
            alert.status = "failed"
            alert.last_error = "SMTP delivery failed; see application logs for details"
            db.commit()
            logger.error(
                "Parent attendance email failed for student profile %s (attempt %s/%s)",
                student_id,
                alert.attempts,
                MAX_ATTEMPTS,
            )
        else:
            alert.status = "sent"
            alert.sent_at = datetime.utcnow()
            alert.last_error = ""
            db.commit()
            logger.info(
                "Sent weekly parent attendance email for student profile %s",
                student_id,
            )
