from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from db import db
from routes.ai_analysis import ai_analysis_bp
from routes.application import application_bp
from routes.auth import auth_bp
from routes.cover_letter import cover_letter_bp
from routes.resume import resume_bp

app = Flask(__name__)
CORS(
    app,
    origins=["http://localhost:5173"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
)
app.config["JWT_SECRET_KEY"] = "careermate-secret-key"
JWTManager(app)
app.register_blueprint(auth_bp)
app.register_blueprint(application_bp)
app.register_blueprint(resume_bp)
app.register_blueprint(ai_analysis_bp)
app.register_blueprint(cover_letter_bp)


@app.route("/")
def home():
    return "CareerMate Backend Running"


@app.get("/test-db")
def test_db():
    try:
        db.command("ping")
        return jsonify({"message": "MongoDB Connected"})
    except Exception as error:
        return jsonify(
            {
                "message": "MongoDB Connection Failed",
                "error": str(error),
            }
        )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
