from __future__ import annotations

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.db.dynamo import get_user_by_id
from app.services.heartbeat import analyze_status
from app.services.hint_engine import should_auto_hint, generate_hint

logger = logging.getLogger(__name__)
router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.student_connections: dict[int, WebSocket] = {}
        self.dashboard_connections: dict[int, list[WebSocket]] = {}
        self.hint_connections: dict[int, WebSocket] = {}
        self.student_events: dict[int, list[dict]] = {}
        self.student_info: dict[int, dict] = {}

    async def connect_student(self, student_id: int, ws: WebSocket):
        await ws.accept()
        self.student_connections[student_id] = ws
        self.student_events[student_id] = []
        user = get_user_by_id(student_id)
        self.student_info[student_id] = {
            "id": student_id,
            "name": user["name"] if user else f"Student {student_id}",
            "status": "normal",
            "stall_min": 0,
            "errors": 0,
        }

    async def connect_dashboard(self, course_id: int, ws: WebSocket):
        await ws.accept()
        if course_id not in self.dashboard_connections:
            self.dashboard_connections[course_id] = []
        self.dashboard_connections[course_id].append(ws)

    async def connect_hints(self, student_id: int, ws: WebSocket):
        await ws.accept()
        self.hint_connections[student_id] = ws

    def disconnect_student(self, student_id: int):
        self.student_connections.pop(student_id, None)
        self.student_events.pop(student_id, None)

    def disconnect_dashboard(self, course_id: int, ws: WebSocket):
        conns = self.dashboard_connections.get(course_id, [])
        if ws in conns:
            conns.remove(ws)

    def disconnect_hints(self, student_id: int):
        self.hint_connections.pop(student_id, None)

    async def broadcast_to_course(self, course_id: int, data: dict):
        conns = self.dashboard_connections.get(course_id, [])
        dead = []
        for ws in conns:
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(ws)
        for ws in dead:
            conns.remove(ws)

    async def send_hint(self, student_id: int, data: dict):
        ws = self.hint_connections.get(student_id)
        if ws:
            try:
                await ws.send_json(data)
            except Exception:
                self.disconnect_hints(student_id)


manager = ConnectionManager()


@router.websocket("/ws/heartbeat/{student_id}")
async def heartbeat_ws(ws: WebSocket, student_id: int):
    await manager.connect_student(student_id, ws)
    try:
        while True:
            data = await ws.receive_json()
            if data.get("type") == "ping":
                await ws.send_json({"type": "pong"})
                continue

            manager.student_events.setdefault(student_id, []).append(data)
            events = manager.student_events[student_id][-20:]
            manager.student_events[student_id] = events

            status = analyze_status(events)
            existing_name = manager.student_info.get(student_id, {}).get("name", f"Student {student_id}")
            manager.student_info[student_id] = {
                "id": student_id,
                "name": existing_name,
                "status": status,
                "stall_min": sum(
                    e.get("data", {}).get("duration_sec", 0)
                    for e in events
                    if e.get("event") == "pause"
                ) // 60,
                "errors": sum(1 for e in events if e.get("event") == "error"),
            }

            # Auto hint check
            stall_sec = sum(
                e.get("data", {}).get("duration_sec", 0)
                for e in events
                if e.get("event") == "pause"
            )
            error_count = sum(1 for e in events if e.get("event") == "error")
            should_hint, level = should_auto_hint(stall_sec, error_count)
            if should_hint:
                hint = await generate_hint("", "", "java", level)
                await manager.send_hint(student_id, {"type": "hint", **hint})

    except WebSocketDisconnect:
        manager.disconnect_student(student_id)


@router.websocket("/ws/dashboard/{course_id}")
async def dashboard_ws(ws: WebSocket, course_id: int):
    await manager.connect_dashboard(course_id, ws)
    try:
        while True:
            students_data = list(manager.student_info.values())
            await ws.send_json({
                "type": "heartbeat_update",
                "students": students_data,
            })
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        manager.disconnect_dashboard(course_id, ws)


@router.websocket("/ws/hints/{student_id}")
async def hints_ws(ws: WebSocket, student_id: int):
    await manager.connect_hints(student_id, ws)
    try:
        while True:
            data = await ws.receive_json()
            if data.get("type") == "ping":
                await ws.send_json({"type": "pong"})
                continue
            if data.get("type") == "request_hint":
                level = data.get("hint_level", 1)
                hint = await generate_hint("", "", "java", min(level, 4))
                await ws.send_json({"type": "hint", **hint})
    except WebSocketDisconnect:
        manager.disconnect_hints(student_id)
