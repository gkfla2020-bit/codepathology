from datetime import date, datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy import Integer, String, ForeignKey, Date, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    language: Mapped[str] = mapped_column(String(50), nullable=False, default="java")
    instructor_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    curriculum: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    instructor = relationship("User", foreign_keys=[instructor_id])
    members = relationship("User", foreign_keys="User.course_id", back_populates="course")
