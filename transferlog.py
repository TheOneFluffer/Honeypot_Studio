from pymongo import MongoClient

# MongoDB connection settings
MONGO_URI = 'mongodb://localhost:27017/'
DATABASE_NAME = 'dionaea'
COLLECTION_NAME = 'logs'

# Connect to MongoDB
client = MongoClient(MONGO_URI)
db = client[DATABASE_NAME]
collection = db[COLLECTION_NAME]

# Read logs from file
log_file_path = 'dionaea-logs.txt'

try:
    with open(log_file_path, 'r') as file:
        logs = file.readlines()

    # Prepare logs for MongoDB
    log_documents = [{"log": log.strip()} for log in logs]

    # Insert logs into MongoDB
    if log_documents:
        result = collection.insert_many(log_documents)
        print(f"Inserted {len(result.inserted_ids)} logs into MongoDB.")

except FileNotFoundError:
    print(f"Log file not found: {log_file_path}")
except Exception as e:
    print(f"An error occurred: {e}")
finally:
    client.close()
