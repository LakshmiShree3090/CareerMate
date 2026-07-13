from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

ai_analysis_bp = Blueprint("ai_analysis", __name__)


@ai_analysis_bp.post("/api/resume/analyze")
@jwt_required()
def analyze_resume():
    return jsonify(
        {
            "score": 78,
            "skills": ["React", "JavaScript", "Python"],
            "missingSkills": ["Docker", "SQL"],
            "suggestions": [
                "Add measurable achievements",
                "Include more technical projects",
                "Improve ATS keywords",
            ],
        }
    )
