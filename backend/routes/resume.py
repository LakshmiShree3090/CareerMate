from pathlib import Path
from uuid import uuid4

import pdfplumber
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from werkzeug.utils import secure_filename

from db import db

resume_bp = Blueprint("resume", __name__)
UPLOAD_FOLDER = Path(__file__).resolve().parent.parent / "uploads"
ALLOWED_EXTENSIONS = {".pdf", ".docx"}


@resume_bp.get("/api/resume")
@jwt_required()
def get_resume():
    resume = db.resumes.find_one({"userEmail": get_jwt_identity()})
    filename = resume["filename"] if resume else None

    return jsonify({"filename": filename})


@resume_bp.post("/api/resume/upload")
@jwt_required()
def upload_resume():
    resume_file = request.files.get("resume")

    if not resume_file or not resume_file.filename:
        return jsonify({"message": "Resume file is required"}), 400

    filename = secure_filename(resume_file.filename)
    extension = Path(filename).suffix.lower()

    if not filename or extension not in ALLOWED_EXTENSIONS:
        return jsonify({"message": "Only PDF and DOCX files are allowed"}), 400

    user_email = get_jwt_identity()
    old_resume = db.resumes.find_one({"userEmail": user_email})
    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

    stored_filename = f"{uuid4().hex}{extension}"
    resume_file.save(UPLOAD_FOLDER / stored_filename)

    db.resumes.update_one(
        {"userEmail": user_email},
        {
            "$set": {
                "filename": filename,
                "storedFilename": stored_filename,
                "userEmail": user_email,
            }
        },
        upsert=True,
    )

    if old_resume and old_resume.get("storedFilename"):
        old_file = UPLOAD_FOLDER / old_resume["storedFilename"]
        if old_file.is_file():
            old_file.unlink()

    return jsonify({"message": "Resume uploaded successfully", "filename": filename})
@resume_bp.post("/api/resume/analyze")
@jwt_required()
def analyze_resume():
    resume = db.resumes.find_one({"userEmail": get_jwt_identity()})

    if not resume:
        return jsonify({"message": "Upload a resume first"}), 404

    resume_path = UPLOAD_FOLDER / resume["storedFilename"]

    with pdfplumber.open(resume_path) as pdf:
        text = " ".join(page.extract_text() or "" for page in pdf.pages).lower()

    skills = [
        "python",
        "java",
        "c++",
        "javascript",
        "react",
        "node",
        "flask",
        "sql",
        "mongodb",
        "git",
        "docker",
        "aws",
    ]
    found_skills = [skill for skill in skills if skill in text]
    missing_skills = [skill for skill in skills if skill not in found_skills][:3]
    score = min(100, 50 + len(found_skills) * 6)

    return jsonify(
        {
            "score": score,
            "skills": found_skills,
            "missingSkills": missing_skills,
            "suggestions": [
                "Add measurable achievements",
                "Include more projects",
                "Improve ATS keywords",
            ],
        }
    )
