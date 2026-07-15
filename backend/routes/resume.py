from pathlib import Path
from datetime import datetime, timezone
from uuid import uuid4

import pdfplumber
from flask import Blueprint, jsonify, request, send_file
from flask_jwt_extended import get_jwt_identity, jwt_required
from werkzeug.utils import secure_filename

from db import db

resume_bp = Blueprint("resume", __name__)
UPLOAD_FOLDER = Path(__file__).resolve().parent.parent / "uploads"
ALLOWED_EXTENSIONS = {".pdf", ".docx"}


def save_resume_file(resume_file):
    if not resume_file or not resume_file.filename:
        return None, "Resume file is required"

    filename = secure_filename(resume_file.filename)
    extension = Path(filename).suffix.lower()

    if not filename or extension not in ALLOWED_EXTENSIONS:
        return None, "Only PDF and DOCX files are allowed"

    UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)
    stored_filename = f"{uuid4().hex}{extension}"
    resume_file.save(UPLOAD_FOLDER / stored_filename)

    return {
        "filename": filename,
        "storedFilename": stored_filename,
        "uploadedAt": datetime.now(timezone.utc),
    }, None


def format_upload_date(uploaded_at):
    if isinstance(uploaded_at, datetime):
        return uploaded_at.isoformat()

    return uploaded_at if isinstance(uploaded_at, str) else None


@resume_bp.get("/api/resume")
@jwt_required()
def get_resume():
    resume = db.resumes.find_one({"userEmail": get_jwt_identity()})
    filename = resume["filename"] if resume else None

    return jsonify({"filename": filename})


@resume_bp.get("/api/resume-library")
@jwt_required()
def get_resume_library():
    user_email = get_jwt_identity()
    resumes_by_stored_filename = {}

    current_resume = db.resumes.find_one({"userEmail": user_email})
    saved_resumes = []
    if current_resume:
        saved_resumes.append(current_resume)
    saved_resumes.extend(db.application_resumes.find({"userEmail": user_email}))

    for resume in saved_resumes:
        stored_filename = resume.get("storedFilename")
        if not stored_filename or stored_filename in resumes_by_stored_filename:
            continue

        resumes_by_stored_filename[stored_filename] = {
            "filename": resume.get("filename", "Unnamed resume"),
            "uploadDate": format_upload_date(resume.get("uploadedAt")),
            "applicationsCount": 0,
            "companies": [],
        }

    for application in db.applications.find({"userEmail": user_email}):
        resume = resumes_by_stored_filename.get(application.get("resumeStoredFilename"))
        if not resume:
            continue

        resume["applicationsCount"] += 1
        company = application.get("company")
        if company and company not in resume["companies"]:
            resume["companies"].append(company)

    return jsonify({"resumes": list(resumes_by_stored_filename.values())})


@resume_bp.get("/api/application-resumes/<stored_filename>")
@jwt_required()
def preview_application_resume(stored_filename):
    application = db.applications.find_one(
        {
            "userEmail": get_jwt_identity(),
            "resumeStoredFilename": stored_filename,
        }
    )

    if not application:
        return jsonify({"message": "Resume not found"}), 404

    resume_path = UPLOAD_FOLDER / stored_filename
    if not resume_path.is_file():
        return jsonify({"message": "Resume file not found"}), 404

    return send_file(
        resume_path,
        as_attachment=False,
        download_name=application.get("resumeFilename", stored_filename),
    )


@resume_bp.post("/api/resume/upload")
@jwt_required()
def upload_resume():
    resume_file = request.files.get("resume")
    resume_data, error = save_resume_file(resume_file)

    if error:
        return jsonify({"message": error}), 400

    user_email = get_jwt_identity()
    old_resume = db.resumes.find_one({"userEmail": user_email})

    db.resumes.update_one(
        {"userEmail": user_email},
        {
            "$set": {
                "filename": resume_data["filename"],
                "storedFilename": resume_data["storedFilename"],
                "uploadedAt": resume_data["uploadedAt"],
                "userEmail": user_email,
            }
        },
        upsert=True,
    )

    if old_resume and old_resume.get("storedFilename"):
        old_file = UPLOAD_FOLDER / old_resume["storedFilename"]
        if old_file.is_file():
            old_file.unlink()

    return jsonify({"message": "Resume uploaded successfully", "filename": resume_data["filename"]})
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
