from flask import Blueprint, jsonify, request
from app.services.honeypot_manager import create_honeypot, get_honeypots, update_honeypot, delete_honeypot

honeypots_bp = Blueprint('honeypots', __name__)

@honeypots_bp.route('/deploy', methods=['POST'])
def deploy_honeypot():
    data = request.json
    # Add logic to deploy a honeypot (e.g., using Docker API)
    return jsonify({"message": "Honeypot deployed", "config": data})

@honeypots_bp.route('/create', methods=['POST'])
def create():
    config = request.json
    result = create_honeypot(config)
    if result.get("status") == "conflict":
        return jsonify(result), 409  # Conflict status code
    elif result.get("status") == "error":
        return jsonify(result), 500  # Internal server error
    return jsonify(result), 201  # Created successfully

@honeypots_bp.route('/list', methods=['GET'])
def list_honeypots():
    result = get_honeypots()
    return jsonify(result)

@honeypots_bp.route('/update/<name>', methods=['PUT'])
def update(name):
    updated_config = request.json
    result = update_honeypot(name, updated_config)
    return jsonify(result)

@honeypots_bp.route('/delete/<name>', methods=['DELETE'])
def delete(name):
    result = delete_honeypot(name)
    return jsonify(result)