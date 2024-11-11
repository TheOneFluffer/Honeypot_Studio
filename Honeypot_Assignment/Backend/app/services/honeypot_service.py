from app.models import HoneypotModel

class HoneypotService:
    @staticmethod
    def create_honeypot(data):
        return HoneypotModel.create(data)

    @staticmethod
    def get_honeypot(honeypot_id):
        return HoneypotModel.get(honeypot_id)

    @staticmethod
    def update_honeypot(honeypot_id, data):
        return HoneypotModel.update(honeypot_id, data)

    @staticmethod
    def delete_honeypot(honeypot_id):
        return HoneypotModel.delete(honeypot_id)

    @staticmethod
    def list_honeypots():
        return HoneypotModel.list_all()
