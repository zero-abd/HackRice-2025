from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from enum import Enum

from pydantic import field_validator

# Let's use a simpler approach - just use str for ObjectId fields
PyObjectId = str

class JobType(str, Enum):
    DOCTOR = "doctor"
    NURSE = "nurse"
    NONE = "none"

class MedicalField(str, Enum):
    CARDIOLOGY = "cardiology"
    NEUROLOGY = "neurology"
    PEDIATRICS = "pediatrics"
    ORTHOPEDICS = "orthopedics"
    DERMATOLOGY = "dermatology"
    PSYCHIATRY = "psychiatry"
    EMERGENCY_MEDICINE = "emergency_medicine"
    INTERNAL_MEDICINE = "internal_medicine"
    SURGERY = "surgery"
    ONCOLOGY = "oncology"
    RADIOLOGY = "radiology"
    ANESTHESIOLOGY = "anesthesiology"
    OTHER = "other"

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    job: JobType = JobType.NONE
    age: Optional[int] = None
    experience_years: Optional[int] = None
    medical_field: Optional[MedicalField] = None
    license_number: Optional[str] = None
    hospital_affiliation: Optional[str] = None
    specializations: Optional[List[str]] = []
    bio: Optional[str] = None

class UserCreate(UserBase):
    auth0_user_id: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    job: Optional[JobType] = None
    age: Optional[int] = None
    experience_years: Optional[int] = None
    medical_field: Optional[MedicalField] = None
    license_number: Optional[str] = None
    hospital_affiliation: Optional[str] = None
    specializations: Optional[List[str]] = None
    bio: Optional[str] = None

class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    auth0_user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    patient_ids: List[PyObjectId] = []

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserResponse(UserBase):
    id: str
    auth0_user_id: str
    created_at: datetime
    updated_at: datetime
    is_active: bool
    patient_count: int = 0

# Patient Models
class PatientBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: datetime
    gender: str
    phone_number: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_history: Optional[List[str]] = []
    current_medications: Optional[List[str]] = []
    allergies: Optional[List[str]] = []
    insurance_info: Optional[Dict[str, Any]] = {}
    notes: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    medical_history: Optional[List[str]] = None
    current_medications: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    insurance_info: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None

class PatientInDB(PatientBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    doctor_id: PyObjectId  # ID of the doctor/nurse who manages this patient
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class PatientResponse(PatientBase):
    id: str
    doctor_id: str
    created_at: datetime
    updated_at: datetime
    is_active: bool

# Conversation Models (for storing summaries)
class ConversationBase(BaseModel):
    patient_id: PyObjectId
    doctor_id: PyObjectId
    conversation_text: str
    summary: Dict[str, Any]
    conversation_date: datetime = Field(default_factory=datetime.utcnow)

class ConversationCreate(ConversationBase):
    pass

class ConversationInDB(ConversationBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ConversationResponse(ConversationBase):
    id: str
    created_at: datetime

    class Config:
        json_encoders = {ObjectId: str}

# API Response Models
class StandardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None

class UserProfileResponse(StandardResponse):
    data: Optional[UserResponse] = None

class PatientListResponse(StandardResponse):
    data: Optional[List[PatientResponse]] = None

class PatientDetailResponse(StandardResponse):
    data: Optional[PatientResponse] = None
