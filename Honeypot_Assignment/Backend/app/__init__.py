from flask import Flask
from app.routes import honeypot_routes

def create_app():
    app = Flask(__name__)
    app.register_blueprint(honeypot_routes)
    return app
