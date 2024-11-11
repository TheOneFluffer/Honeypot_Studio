from flask import Blueprint, request, jsonify
from app.services.honeypot_service import HoneypotService

honeypot_routes = Blueprint("honeypots", __name__)

@honeypot_routes.route("/honeypots", methods=["POST"])
def create_honeypot():
    data = request.json
    honeypot_id = HoneypotService.create_honeypot(data)
    return jsonify({"message": "Honeypot created", "id": honeypot_id}), 201

@honeypot_routes.route("/honeypots/<string:honeypot_id>", methods=["GET"])
def get_honeypot(honeypot_id):
    honeypot = HoneypotService.get_honeypot(honeypot_id)
    if honeypot:
        honeypot["_id"] = str(honeypot["_id"])  # Convert ObjectId to string
        return jsonify(honeypot)
    return jsonify({"error": "Honeypot not found"}), 404

@honeypot_routes.route("/honeypots/<string:honeypot_id>", methods=["PUT"])
def update_honeypot(honeypot_id):
    data = request.json
    success = HoneypotService.update_honeypot(honeypot_id, data)
    if success:
        return jsonify({"message": "Honeypot updated"})
    return jsonify({"error": "Honeypot not found"}), 404

@honeypot_routes.route("/honeypots/<string:honeypot_id>", methods=["DELETE"])
def delete_honeypot(honeypot_id):
    success = HoneypotService.delete_honeypot(honeypot_id)
    if success:
        return jsonify({"message": "Honeypot deleted"})
    return jsonify({"error": "Honeypot not found"}), 404

@honeypot_routes.route("/honeypots", methods=["GET"])
def list_honeypots():
    honeypots = HoneypotService.list_honeypots()
    for honeypot in honeypots:
        honeypot["_id"] = str(honeypot["_id"])  # Convert ObjectId to string
    return jsonify(honeypots)
