from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import os
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    database = None

# MongoDB connection
mongodb = MongoDB()

async def connect_to_mongo():
    """Create database connection"""
    try:
        # Get MongoDB URL from environment or use default
        mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        database_name = os.getenv("MONGODB_DATABASE", "docless_db")
        
        mongodb.client = AsyncIOMotorClient(mongodb_url)
        mongodb.database = mongodb.client[database_name]
        
        # Test the connection
        await mongodb.client.admin.command('ping')
        logger.info(f"Connected to MongoDB at {mongodb_url}")
        
    except ConnectionFailure as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise e

async def close_mongo_connection():
    """Close database connection"""
    if mongodb.client:
        mongodb.client.close()
        logger.info("Disconnected from MongoDB")

def get_database():
    """Get database instance"""
    if mongodb.database is None:
        raise Exception("Database not initialized. Call connect_to_mongo() first.")
    return mongodb.database

# Collection names
USERS_COLLECTION = "users"
PATIENTS_COLLECTION = "patients"
CONVERSATIONS_COLLECTION = "conversations"
SESSIONS_COLLECTION = "sessions"
