import asyncio
import logging
import os
from contextlib import asynccontextmanager, suppress
from datetime import date, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import SessionLocal, upgrade_schema
from .core.parent_attendance_alerts import is_configured, send_weekly_parent_warnings
from .routers import (
    auth, users, departments, academics, attendance, dashboard, reports, face,
    swaps, classrooms, audit, settings, camera,
)

upgrade_schema()

logger = logging.getLogger("attendify.parent_alerts")
metrics_logger = logging.getLogger("attendify.recognition_metrics")


def _send_last_completed_week_warnings():
    today = date.today()
    current_week_start = today - timedelta(days=today.weekday())
    week_start = current_week_start - timedelta(days=7)
    week_end = current_week_start - timedelta(days=1)
    db = SessionLocal()
    try:
        send_weekly_parent_warnings(db, week_start, week_end)
    finally:
        db.close()


async def _parent_alert_scheduler():
    while True:
        try:
            await asyncio.to_thread(_send_last_completed_week_warnings)
        except Exception:
            logger.exception("Unexpected error while processing weekly parent attendance warnings")
        await asyncio.sleep(60 * 60)


async def _run_model_evaluation():
    try:
        from .eval_models import run_all

        await asyncio.to_thread(run_all)
    except Exception:
        metrics_logger.exception("Optional model evaluation failed")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    task = None
    evaluation_task = None
    eval_on_startup = os.getenv("EVAL_ON_STARTUP") == "1"
    if eval_on_startup:
        evaluation_task = asyncio.create_task(_run_model_evaluation())
    else:
        metrics_logger.warning(
            "Recognition metrics: accuracy=NOT EVALUATED, precision=NOT EVALUATED, "
            "recall=NOT EVALUATED (set EVAL_ON_STARTUP=1 and configure a labeled "
            "evaluation dataset to calculate them)"
        )
    if is_configured():
        task = asyncio.create_task(_parent_alert_scheduler())
    else:
        logger.warning(
            "SMTP is not configured; weekly parent attendance emails are disabled"
        )
    try:
        yield
    finally:
        if task:
            task.cancel()
            with suppress(asyncio.CancelledError):
                await task
        if evaluation_task:
            await evaluation_task


app = FastAPI(title="Attendify API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    # Allow localhost/127.0.0.1 plus any private LAN IP (10.x, 172.16-31.x, 192.168.x)
    # so the app also works when opened from another device on the same network.
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(departments.router)
app.include_router(academics.router)
app.include_router(attendance.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(face.router)
app.include_router(swaps.router)
app.include_router(classrooms.router)
app.include_router(audit.router)
app.include_router(settings.router)
app.include_router(camera.router)


@app.get("/")
def root():
    return {"status": "Attendify API is running"}
