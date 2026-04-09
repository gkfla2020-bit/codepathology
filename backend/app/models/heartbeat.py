from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy import Integer, String, ForeignKey, DateTime, JSON, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class HeartbeatEvent(Base):
    __tablename__ = "heartbeat_events"
    __table_args__ = (
        CheckConstraint(
            "status IN ('normal', 'stalled', 'danger')",
            name="ck_heartbeat_status",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"), nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="normal")
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
