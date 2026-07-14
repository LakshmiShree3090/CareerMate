from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from db import db

cover_letter_bp = Blueprint("cover_letter", __name__)


@cover_letter_bp.post("/api/cover-letter/generate")
@jwt_required()
def generate_cover_letter():
    data = request.get_json(silent=True) or {}
    company = data.get("company", "").strip()
    role = data.get("role", "").strip()

    if not company or not role:
        return jsonify({"message": "Company and role are required"}), 400

    resume = db.resumes.find_one({"userEmail": get_jwt_identity()})

    if not resume:
        return jsonify({"message": "Upload a resume first"}), 404

    cover_letter = f"""Dear Hiring Team at {company},

I am writing to express my interest in the {role} position. My experience and skills, as outlined in my resume, have prepared me to contribute effectively to your team.

I am excited by the opportunity to bring a strong work ethic, technical ability, and a collaborative mindset to {company}. I would welcome the opportunity to discuss how I can support your goals in this role.

Thank you for your time and consideration.

Sincerely,
CareerMate Candidate"""

    return jsonify({"coverLetter": cover_letter})
