from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from werkzeug.security import check_password_hash, generate_password_hash

from db import db

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/api/auth/signup")
def signup():
    user = request.get_json()

    if db.users.find_one({"email": user["email"]}):
        return jsonify({"message": "Email already exists"}), 409

    db.users.insert_one(
        {
            "name": user["name"],
            "email": user["email"],
            "password": generate_password_hash(user["password"]),
        }
    )
    return jsonify({"message": "Signup Successful"}), 201


@auth_bp.post("/api/auth/login")
def login():
    user_data = request.get_json()
    user = db.users.find_one({"email": user_data["email"]})

    if not user or not check_password_hash(user["password"], user_data["password"]):
        return jsonify({"message": "Invalid credentials"}), 401

    token = create_access_token(identity=user["email"])
    return jsonify({"message": "Login Successful", "token": token})


@auth_bp.get("/api/auth/me")
@jwt_required()
def get_current_user():
    email = get_jwt_identity()
    user = db.users.find_one({"email": email})

    return jsonify({"name": user["name"], "email": user["email"]})
