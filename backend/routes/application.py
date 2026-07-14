from bson import ObjectId
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from db import db
from routes.resume import save_resume_file

application_bp = Blueprint("application", __name__)


def get_application_data():
    data = request.get_json(silent=True)
    required_fields = [
        "company",
        "role",
        "status",
        "appliedDate",
        "resumeFilename",
        "resumeStoredFilename",
    ]

    if not data or any(field not in data for field in required_fields):
        return None

    application = {field: data[field] for field in required_fields}
    optional_fields = [
        "interviewDate",
        "interviewTime",
        "interviewMode",
        "interviewLocation",
        "interviewNotes",
    ]

    for field in optional_fields:
        application[field] = data.get(field, "")

    if application["interviewMode"] not in ("", "Online", "Offline"):
        return None

    return application


def serialize_application(application):
    application["_id"] = str(application["_id"])
    return application


def get_object_id(application_id):
    try:
        return ObjectId(application_id)
    except Exception:
        return None


def create_timeline_event(title, description=None):
    event = {
        "title": title,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    if description:
        event["description"] = description

    return event


def interview_description(application):
    details = [application.get("interviewDate"), application.get("interviewTime")]
    if application.get("interviewMode"):
        details.append(application["interviewMode"])
    if application.get("interviewLocation"):
        details.append(application["interviewLocation"])

    return " · ".join(detail for detail in details if detail)


@application_bp.get("/api/application-resumes")
@jwt_required()
def get_application_resumes():
    user_email = get_jwt_identity()
    resumes = []
    stored_filenames = set()
    current_resume = db.resumes.find_one({"userEmail": user_email})

    if current_resume and current_resume.get("storedFilename"):
        resumes.append(
            {
                "filename": current_resume["filename"],
                "storedFilename": current_resume["storedFilename"],
            }
        )
        stored_filenames.add(current_resume["storedFilename"])

    for resume in db.application_resumes.find({"userEmail": user_email}):
        if resume["storedFilename"] not in stored_filenames:
            resumes.append(
                {
                    "filename": resume["filename"],
                    "storedFilename": resume["storedFilename"],
                }
            )
            stored_filenames.add(resume["storedFilename"])

    return jsonify({"resumes": resumes})


@application_bp.post("/api/application-resumes/upload")
@jwt_required()
def upload_application_resume():
    resume_data, error = save_resume_file(request.files.get("resume"))

    if error:
        return jsonify({"message": error}), 400

    resume_data["userEmail"] = get_jwt_identity()
    db.application_resumes.insert_one(resume_data)

    return jsonify({"resume": {"filename": resume_data["filename"], "storedFilename": resume_data["storedFilename"]}}), 201


@application_bp.post("/api/applications")
@jwt_required()
def create_application():
    application = get_application_data()

    if not application:
        return jsonify({"message": "All application fields are required"}), 400

    application["userEmail"] = get_jwt_identity()
    application["timeline"] = [
        create_timeline_event(
            "Application Created",
            f"{application['company']} · {application['role']}",
        ),
        create_timeline_event("Resume Linked", application["resumeFilename"]),
    ]

    if application.get("interviewDate"):
        application["timeline"].append(
            create_timeline_event("Interview Scheduled", interview_description(application))
        )

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

    existing_application = db.applications.find_one(
        {"_id": object_id, "userEmail": get_jwt_identity()}
    )

    if not existing_application:
        return jsonify({"message": "Application not found"}), 404

    timeline = existing_application.get("timeline", [])

    if existing_application.get("resumeStoredFilename") != application["resumeStoredFilename"]:
        timeline.append(create_timeline_event("Resume Linked", application["resumeFilename"]))

    if existing_application.get("status") != application["status"]:
        timeline.append(
            create_timeline_event(
                "Status Changed",
                f"{existing_application.get('status', 'Unknown')} to {application['status']}",
            )
        )

    interview_fields = [
        "interviewDate",
        "interviewTime",
        "interviewMode",
        "interviewLocation",
        "interviewNotes",
    ]
    had_interview = bool(existing_application.get("interviewDate"))
    has_interview = bool(application.get("interviewDate"))
    interview_changed = any(
        existing_application.get(field, "") != application[field]
        for field in interview_fields
    )

    if not had_interview and has_interview:
        timeline.append(
            create_timeline_event("Interview Scheduled", interview_description(application))
        )
    elif had_interview and interview_changed:
        description = interview_description(application) if has_interview else "Interview removed"
        timeline.append(create_timeline_event("Interview Updated", description))

    application["timeline"] = timeline
    db.applications.update_one(
        {"_id": object_id, "userEmail": get_jwt_identity()},
        {"$set": application},
    )

    return jsonify({"message": "Application updated", "timeline": timeline})


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
