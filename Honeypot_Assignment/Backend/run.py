from app import create_app
from app.api.honeypots import honeypots_bp

app = create_app()
app.register_blueprint(honeypots_bp, url_prefix='/api/honeypots')

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
