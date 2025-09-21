#!/usr/bin/env python3
"""
Database setup script for DocLess MongoDB integration
Run this script to create indexes and initial database setup
"""

import asyncio
import os
import sys

# Add the current directory to Python path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from database.connection import USERS_COLLECTION, PATIENTS_COLLECTION, CONVERSATIONS_COLLECTION

# Load environment variables
load_dotenv()

async def setup_database():
    """Create MongoDB indexes and initial setup"""
    
    # Get MongoDB configuration
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    database_name = os.getenv("MONGODB_DATABASE", "docless_db")
    
    print(f"Connecting to MongoDB at: {mongodb_url}")
    print(f"Database: {database_name}")
    
    try:
        # Connect to MongoDB
        client = AsyncIOMotorClient(mongodb_url)
        db = client[database_name]
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB successfully!")
        
        # Create indexes for better performance
        print("\n📋 Creating database indexes...")
        
        # Users collection indexes
        await db[USERS_COLLECTION].create_index("email", unique=True)
        await db[USERS_COLLECTION].create_index("auth0_user_id", unique=True)
        await db[USERS_COLLECTION].create_index("job")
        print("   ✅ Users collection indexes created")
        
        # Patients collection indexes
        await db[PATIENTS_COLLECTION].create_index("doctor_id")
        await db[PATIENTS_COLLECTION].create_index([("first_name", 1), ("last_name", 1)])
        await db[PATIENTS_COLLECTION].create_index("is_active")
        print("   ✅ Patients collection indexes created")
        
        # Conversations collection indexes
        await db[CONVERSATIONS_COLLECTION].create_index([("patient_id", 1), ("conversation_date", -1)])
        await db[CONVERSATIONS_COLLECTION].create_index("doctor_id")
        await db[CONVERSATIONS_COLLECTION].create_index("conversation_date")
        print("   ✅ Conversations collection indexes created")
        
        # Display database statistics
        print("\n📊 Database Statistics:")
        
        users_count = await db[USERS_COLLECTION].count_documents({})
        patients_count = await db[PATIENTS_COLLECTION].count_documents({})
        conversations_count = await db[CONVERSATIONS_COLLECTION].count_documents({})
        
        print(f"   👥 Users: {users_count}")
        print(f"   🏥 Patients: {patients_count}")
        print(f"   💬 Conversations: {conversations_count}")
        
        # Show collections
        collections = await db.list_collection_names()
        print(f"\n📁 Collections: {', '.join(collections)}")
        
        print("\n🎉 Database setup completed successfully!")
        
    except Exception as e:
        print(f"❌ Error setting up database: {e}")
        raise e
    finally:
        client.close()

if __name__ == "__main__":
    print("🚀 DocLess Database Setup")
    print("=" * 50)
    
    # Check if MongoDB is running
    mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    
    if "localhost" in mongodb_url:
        print("⚠️  Make sure MongoDB is running locally:")
        print("   - Start MongoDB service")
        print("   - Or use: mongod --dbpath /path/to/your/db")
        print()
    
    try:
        asyncio.run(setup_database())
    except KeyboardInterrupt:
        print("\n👋 Setup cancelled by user")
    except Exception as e:
        print(f"\n💥 Setup failed: {e}")
        exit(1)
