from pydantic import BaseModel


class DiagnosisResult(BaseModel):
    pathology_name: str
    pathology_code: str
    category: str
    severity: str
    symptom: str
    root_cause: str
    prescription: str
    meta_insight: str = ""


class DiagnosisResponse(BaseModel):
    id: int
    submission_id: int
    pathology_name: str
    pathology_code: str
    category: str
    severity: str
    symptom: str
    root_cause: str
    prescription: str
    is_recurring: bool
    recurrence_count: int

    model_config = {"from_attributes": True}
