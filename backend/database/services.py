from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
import logging

from .connection import get_database, USERS_COLLECTION, PATIENTS_COLLECTION, SESSIONS_COLLECTION
from .models import (
    UserCreate, UserUpdate, UserInDB, UserResponse,
    PatientCreate, PatientUpdate, PatientInDB, PatientResponse,
    SessionCreate, SessionUpdate, SessionInDB, SessionResponse
)

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self):
        self.db = None
    
    def get_db(self):
        if self.db is None:
            self.db = get_database()
        return self.db
    
    async def create_user(self, user_data: UserCreate) -> UserInDB:
        """Create a new user in the database"""
        try:
            db = self.get_db()
            
            # Check if user already exists
            existing_user = await db[USERS_COLLECTION].find_one({
                "$or": [
                    {"email": user_data.email},
                    {"auth0_user_id": user_data.auth0_user_id}
                ]
            })
            
            if existing_user:
                # User exists, return existing user - convert ObjectId to string
                existing_user["_id"] = str(existing_user["_id"])
                # Convert ObjectIds in patient_ids to strings
                if "patient_ids" in existing_user and existing_user["patient_ids"]:
                    existing_user["patient_ids"] = [str(pid) if isinstance(pid, ObjectId) else pid for pid in existing_user["patient_ids"]]
                return UserInDB(**existing_user)
            
            # Create new user
            user_dict = user_data.dict()
            user_dict["created_at"] = datetime.utcnow()
            user_dict["updated_at"] = datetime.utcnow()
            user_dict["is_active"] = True
            user_dict["patient_ids"] = []
            
            result = await db[USERS_COLLECTION].insert_one(user_dict)
            user_dict["_id"] = str(result.inserted_id)
            
            logger.info(f"Created new user: {user_data.email}")
            return UserInDB(**user_dict)
            
        except Exception as e:
            logger.error(f"Error creating user: {e}")
            raise e
    
    async def get_user_by_email(self, email: str) -> Optional[UserInDB]:
        """Get user by email"""
        try:
            db = self.get_db()
            user_doc = await db[USERS_COLLECTION].find_one({"email": email})
            
            if user_doc:
                user_doc["_id"] = str(user_doc["_id"])
                # Convert ObjectIds in patient_ids to strings
                if "patient_ids" in user_doc and user_doc["patient_ids"]:
                    user_doc["patient_ids"] = [str(pid) if isinstance(pid, ObjectId) else pid for pid in user_doc["patient_ids"]]
                return UserInDB(**user_doc)
            return None
            
        except Exception as e:
            logger.error(f"Error getting user by email: {e}")
            raise e
    
    async def get_user_by_auth0_id(self, auth0_user_id: str) -> Optional[UserInDB]:
        """Get user by Auth0 user ID"""
        try:
            db = self.get_db()
            user_doc = await db[USERS_COLLECTION].find_one({"auth0_user_id": auth0_user_id})
            
            if user_doc:
                user_doc["_id"] = str(user_doc["_id"])
                # Convert ObjectIds in patient_ids to strings
                if "patient_ids" in user_doc and user_doc["patient_ids"]:
                    user_doc["patient_ids"] = [str(pid) if isinstance(pid, ObjectId) else pid for pid in user_doc["patient_ids"]]
                return UserInDB(**user_doc)
            return None
            
        except Exception as e:
            logger.error(f"Error getting user by Auth0 ID: {e}")
            raise e
    
    async def update_user(self, user_id: str, user_update: UserUpdate) -> Optional[UserInDB]:
        """Update user information"""
        try:
            db = self.get_db()
            
            # Prepare update data
            update_data = user_update.dict(exclude_unset=True)
            if update_data:
                update_data["updated_at"] = datetime.utcnow()
                
                result = await db[USERS_COLLECTION].find_one_and_update(
                    {"_id": ObjectId(user_id)},
                    {"$set": update_data},
                    return_document=True
                )
                
                if result:
                    logger.info(f"Updated user: {user_id}")
                    result["_id"] = str(result["_id"])
                    return UserInDB(**result)
            
            return None
            
        except Exception as e:
            logger.error(f"Error updating user: {e}")
            raise e
    
    async def get_user_response(self, user: UserInDB) -> UserResponse:
        """Convert UserInDB to UserResponse with patient count"""
        try:
            db = self.get_db()
            
            # Count patients for this user
            patient_count = await db[PATIENTS_COLLECTION].count_documents({
                "doctor_id": user.id,
                "is_active": True
            })
            
            return UserResponse(
                id=str(user.id),
                email=user.email,
                name=user.name,
                job=user.job,
                age=user.age,
                experience_years=user.experience_years,
                medical_field=user.medical_field,
                license_number=user.license_number,
                hospital_affiliation=user.hospital_affiliation,
                specializations=user.specializations,
                bio=user.bio,
                auth0_user_id=user.auth0_user_id,
                created_at=user.created_at,
                updated_at=user.updated_at,
                is_active=user.is_active,
                patient_count=patient_count
            )
            
        except Exception as e:
            logger.error(f"Error creating user response: {e}")
            raise e

class PatientService:
    def __init__(self):
        self.db = None
    
    def get_db(self):
        if self.db is None:
            self.db = get_database()
        return self.db
    
    async def create_patient(self, patient_data: PatientCreate, doctor_id: str) -> PatientInDB:
        """Create a new patient"""
        try:
            db = self.get_db()
            
            patient_dict = patient_data.dict()
            patient_dict["doctor_id"] = ObjectId(doctor_id)
            patient_dict["session_ids"] = []
            patient_dict["created_at"] = datetime.utcnow()
            patient_dict["updated_at"] = datetime.utcnow()
            patient_dict["is_active"] = True
            
            result = await db[PATIENTS_COLLECTION].insert_one(patient_dict)
            patient_dict["_id"] = str(result.inserted_id)
            patient_dict["doctor_id"] = doctor_id
            
            # Add patient ID to doctor's patient list
            await db[USERS_COLLECTION].update_one(
                {"_id": ObjectId(doctor_id)},
                {"$push": {"patient_ids": result.inserted_id}}
            )
            
            logger.info(f"Created new patient for doctor: {doctor_id}")
            return PatientInDB(**patient_dict)
            
        except Exception as e:
            logger.error(f"Error creating patient: {e}")
            raise e
    
    async def get_patients_by_doctor(self, doctor_id: str) -> List[PatientInDB]:
        """Get all patients for a specific doctor"""
        try:
            db = self.get_db()
            
            cursor = db[PATIENTS_COLLECTION].find({
                "doctor_id": ObjectId(doctor_id),
                "is_active": True
            })
            
            patients = []
            async for patient_doc in cursor:
                patient_doc["_id"] = str(patient_doc["_id"])
                patient_doc["doctor_id"] = str(patient_doc["doctor_id"])
                patients.append(PatientInDB(**patient_doc))
            
            return patients
            
        except Exception as e:
            logger.error(f"Error getting patients for doctor: {e}")
            raise e
    
    async def get_patient_by_id(self, patient_id: str) -> Optional[PatientInDB]:
        """Get a specific patient by ID"""
        try:
            db = self.get_db()
            
            patient_doc = await db[PATIENTS_COLLECTION].find_one({
                "_id": ObjectId(patient_id),
                "is_active": True
            })
            
            if patient_doc:
                patient_doc["_id"] = str(patient_doc["_id"])
                patient_doc["doctor_id"] = str(patient_doc["doctor_id"])
                return PatientInDB(**patient_doc)
            return None
            
        except Exception as e:
            logger.error(f"Error getting patient by ID: {e}")
            raise e
    
    async def update_patient(self, patient_id: str, patient_update: PatientUpdate) -> Optional[PatientInDB]:
        """Update patient information"""
        try:
            db = self.get_db()
            
            update_data = patient_update.dict(exclude_unset=True)
            if update_data:
                update_data["updated_at"] = datetime.utcnow()
                
                result = await db[PATIENTS_COLLECTION].find_one_and_update(
                    {"_id": ObjectId(patient_id)},
                    {"$set": update_data},
                    return_document=True
                )
                
                if result:
                    logger.info(f"Updated patient: {patient_id}")
                    result["_id"] = str(result["_id"])
                    result["doctor_id"] = str(result["doctor_id"])
                    return PatientInDB(**result)
            
            return None
            
        except Exception as e:
            logger.error(f"Error updating patient: {e}")
            raise e
    
    async def delete_patient(self, patient_id: str) -> bool:
        """Soft delete a patient (set is_active to False)"""
        try:
            db = self.get_db()
            
            result = await db[PATIENTS_COLLECTION].update_one(
                {"_id": ObjectId(patient_id)},
                {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
            )
            
            if result.modified_count > 0:
                # Remove patient ID from doctor's patient list
                await db[USERS_COLLECTION].update_many(
                    {"patient_ids": ObjectId(patient_id)},
                    {"$pull": {"patient_ids": ObjectId(patient_id)}}
                )
                
                logger.info(f"Deleted patient: {patient_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error deleting patient: {e}")
            raise e
    
    def patient_to_response(self, patient: PatientInDB) -> PatientResponse:
        """Convert PatientInDB to PatientResponse"""
        return PatientResponse(
            id=str(patient.id),
            first_name=patient.first_name,
            last_name=patient.last_name,
            date_of_birth=patient.date_of_birth,
            gender=patient.gender,
            phone_number=patient.phone_number,
            address=patient.address,
            emergency_contact_name=patient.emergency_contact_name,
            emergency_contact_phone=patient.emergency_contact_phone,
            medical_history=patient.medical_history,
            current_medications=patient.current_medications,
            allergies=patient.allergies,
            insurance_info=patient.insurance_info,
            notes=patient.notes,
            doctor_id=str(patient.doctor_id),
            session_ids=patient.session_ids,
            created_at=patient.created_at,
            updated_at=patient.updated_at,
            is_active=patient.is_active
        )

class SessionService:
    def __init__(self):
        self.db = None
    
    def get_db(self):
        if self.db is None:
            self.db = get_database()
        return self.db
    
    async def create_session(self, session_data: SessionCreate) -> SessionInDB:
        """Create a new session"""
        try:
            db = self.get_db()
            
            session_dict = session_data.dict()
            session_dict["patient_id"] = ObjectId(session_data.patient_id)
            session_dict["doctor_id"] = ObjectId(session_data.doctor_id)
            session_dict["created_at"] = datetime.utcnow()
            session_dict["updated_at"] = datetime.utcnow()
            
            result = await db[SESSIONS_COLLECTION].insert_one(session_dict)
            session_dict["_id"] = str(result.inserted_id)
            session_dict["patient_id"] = str(session_data.patient_id)
            session_dict["doctor_id"] = str(session_data.doctor_id)
            
            # Add session UUID to patient's session_ids list
            await db[PATIENTS_COLLECTION].update_one(
                {"_id": ObjectId(session_data.patient_id)},
                {"$push": {"session_ids": session_data.session_id}}
            )
            
            logger.info(f"Created new session for patient: {session_data.patient_id}")
            return SessionInDB(**session_dict)
            
        except Exception as e:
            logger.error(f"Error creating session: {e}")
            raise e
    
    async def get_sessions_by_patient(self, patient_id: str) -> List[SessionInDB]:
        """Get all sessions for a specific patient"""
        try:
            db = self.get_db()
            
            cursor = db[SESSIONS_COLLECTION].find({
                "patient_id": ObjectId(patient_id)
            }).sort("date", -1)  # Sort by date descending
            
            sessions = []
            async for session_doc in cursor:
                session_doc["_id"] = str(session_doc["_id"])
                session_doc["patient_id"] = str(session_doc["patient_id"])
                session_doc["doctor_id"] = str(session_doc["doctor_id"])
                sessions.append(SessionInDB(**session_doc))
            
            return sessions
            
        except Exception as e:
            logger.error(f"Error getting sessions for patient: {e}")
            raise e
    
    async def get_session_by_id(self, session_id: str) -> Optional[SessionInDB]:
        """Get a specific session by UUID"""
        try:
            db = self.get_db()
            
            session_doc = await db[SESSIONS_COLLECTION].find_one({
                "session_id": session_id
            })
            
            if session_doc:
                session_doc["_id"] = str(session_doc["_id"])
                session_doc["patient_id"] = str(session_doc["patient_id"])
                session_doc["doctor_id"] = str(session_doc["doctor_id"])
                return SessionInDB(**session_doc)
            return None
            
        except Exception as e:
            logger.error(f"Error getting session by ID: {e}")
            raise e
    
    async def update_session(self, session_id: str, session_data: SessionUpdate) -> Optional[SessionInDB]:
        """Update an existing session"""
        try:
            db = self.get_db()
            
            update_dict = session_data.dict(exclude_unset=True)
            update_dict["updated_at"] = datetime.utcnow()
            
            result = await db[SESSIONS_COLLECTION].update_one(
                {"session_id": session_id},
                {"$set": update_dict}
            )
            
            if result.modified_count > 0:
                return await self.get_session_by_id(session_id)
            return None
            
        except Exception as e:
            logger.error(f"Error updating session: {e}")
            raise e
    
    def session_to_response(self, session: SessionInDB) -> SessionResponse:
        """Convert SessionInDB to SessionResponse"""
        return SessionResponse(
            id=str(session.id),
            session_id=session.session_id,
            patient_id=str(session.patient_id),
            doctor_id=str(session.doctor_id),
            title=session.title,
            transcript=session.transcript,
            summary=session.summary,
            date=session.date,
            duration=session.duration,
            status=session.status,
            created_at=session.created_at,
            updated_at=session.updated_at
        )

# Initialize services
user_service = UserService()
patient_service = PatientService()
session_service = SessionService()
