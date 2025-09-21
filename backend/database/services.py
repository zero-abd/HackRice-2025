from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
import logging

from .connection import get_database, USERS_COLLECTION, PATIENTS_COLLECTION
from .models import (
    UserCreate, UserUpdate, UserInDB, UserResponse,
    PatientCreate, PatientUpdate, PatientInDB, PatientResponse
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
            created_at=patient.created_at,
            updated_at=patient.updated_at,
            is_active=patient.is_active
        )

# Initialize services
user_service = UserService()
patient_service = PatientService()
