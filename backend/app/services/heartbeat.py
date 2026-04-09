from __future__ import annotations


def analyze_status(events: list[dict]) -> str:
    if not events:
        return "normal"

    total_stall = 0
    total_errors = 0

    for e in events:
        if e.get("event") == "pause":
            total_stall += e.get("data", {}).get("duration_sec", 0)
        if e.get("event") == "error":
            total_errors += 1

    if total_stall >= 600 and total_errors >= 5:
        return "danger"
    if total_stall >= 300 or total_errors >= 3:
        return "stalled"
    return "normal"
