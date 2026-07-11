from flask import Flask, jsonify

from db import db

app = Flask(__name__)


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
