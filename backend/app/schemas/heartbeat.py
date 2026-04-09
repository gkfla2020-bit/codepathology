from pydantic import BaseModel


class HeartbeatData(BaseModel):
    type: str = "heartbeat"
    event: str
    data: dict
