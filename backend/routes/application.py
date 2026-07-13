from bson import ObjectId
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from db import db

application_bp = Blueprint("application", __name__)


def get_application_data():
    data = request.get_json(silent=True)
    required_fields = ["company", "role", "status", "appliedDate"]

    if not data or any(field not in data for field in required_fields):
        return None

    return {field: data[field] for field in required_fields}


def serialize_application(application):
    application["_id"] = str(application["_id"])
    return application


def get_object_id(application_id):
    try:
        return ObjectId(application_id)
    except Exception:
        return None


@application_bp.post("/api/applications")
@jwt_required()
def create_application():
    application = get_application_data()

    if not application:
        return jsonify({"message": "All application fields are required"}), 400

    application["userEmail"] = get_jwt_identity()
    result = db.applications.insert_one(application)

    return jsonify({"message": "Application created", "id": str(result.inserted_id)}), 201


@application_bp.get("/api/applications")
@jwt_required()
def get_applications():
    user_email = get_jwt_identity()
    applications = db.applications.find({"userEmail": user_email})

    return jsonify({"applications": [serialize_application(app) for app in applications]})


@application_bp.put("/api/applications/<application_id>")
@jwt_required()
def update_application(application_id):
    object_id = get_object_id(application_id)
    application = get_application_data()

    if not object_id:
        return jsonify({"message": "Invalid application ID"}), 400

    if not application:
        return jsonify({"message": "All application fields are required"}), 400

    result = db.applications.update_one(
        {"_id": object_id, "userEmail": get_jwt_identity()},
        {"$set": application},
    )

    if result.matched_count == 0:
        return jsonify({"message": "Application not found"}), 404

    return jsonify({"message": "Application updated"})


@application_bp.delete("/api/applications/<application_id>")
@jwt_required()
def delete_application(application_id):
    object_id = get_object_id(application_id)

    if not object_id:
        return jsonify({"message": "Invalid application ID"}), 400

    result = db.applications.delete_one(
        {"_id": object_id, "userEmail": get_jwt_identity()}
    )

    if result.deleted_count == 0:
        return jsonify({"message": "Application not found"}), 404

    return jsonify({"message": "Application deleted"})
