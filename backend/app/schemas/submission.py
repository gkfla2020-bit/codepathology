from typing import Optional
from pydantic import BaseModel


class SubmissionCreate(BaseModel):
    code: str
    language: str = "java"
    file_name: Optional[str] = None


class SubmissionResponse(BaseModel):
    id: int
    student_id: int
    course_id: int
    code: str
    language: str

    model_config = {"from_attributes": True}
