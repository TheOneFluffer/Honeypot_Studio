from pymongo import MongoClient
from bson.objectid import ObjectId

client = MongoClient("mongodb://localhost:27017/")
db = client["honeypot_studio"]

class HoneypotModel:
    @staticmethod
    def create(data):
        result = db.honeypots.insert_one(data)
        return str(result.inserted_id)

    @staticmethod
    def get(honeypot_id):
        return db.honeypots.find_one({"_id": ObjectId(honeypot_id)})

    @staticmethod
    def update(honeypot_id, data):
        result = db.honeypots.update_one({"_id": ObjectId(honeypot_id)}, {"$set": data})
        return result.modified_count > 0

    @staticmethod
    def delete(honeypot_id):
        result = db.honeypots.delete_one({"_id": ObjectId(honeypot_id)})
        return result.deleted_count > 0

    @staticmethod
    def list_all():
        return list(db.honeypots.find())
