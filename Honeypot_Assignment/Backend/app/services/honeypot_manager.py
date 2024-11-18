from app.db.mongo_config import get_db
import docker
import socket
import logging
from docker.errors import NotFound, APIError

db = get_db()
docker_client = docker.from_env()

def find_available_port(start=1024, end=65535):
    """Find an available port in the specified range."""
    for port in range(start, end):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(("localhost", port)) != 0:
                return port
    raise RuntimeError("No available ports found")

def create_honeypot(config):
    try:
        # Check if a container with the same name exists
        container = docker_client.containers.get(config["name"])
        return {"message": f"Container with name '{config['name']}' already exists.", "status": "conflict"}
    except NotFound:
        # No existing container with the same name, proceed to create a new one
        try:
            # Check and adjust the port if needed
            host_port = list(config["ports"].keys())[0].split("/")[0]
            if socket.socket(socket.AF_INET, socket.SOCK_STREAM).connect_ex(("localhost", int(host_port))) == 0:
                host_port = find_available_port()
                config["ports"] = {f"{host_port}/tcp": config["ports"]["22/tcp"]}
            
            # Create the container
            logging.debug("Creating container...")
            container = docker_client.containers.run(
                image=config["image"],
                name=config["name"],
                detach=True,
                ports=config["ports"],
            )
            logging.debug(f"Container created: {container.id}")

            # Save to database
            honeypots = db.honeypots
            honeypots.insert_one({
                "name": config["name"],
                "image": config["image"],
                "ports": config["ports"],
                "container_id": container.id,
                "status": "running",
            })

            logging.debug("Honeypot saved to database.")
            return {"container_id": container.id, "name": config["name"]}
        except APIError as e:
            logging.error(f"Error creating honeypot: {str(e)}")
            return {"message": f"Failed to create container: {str(e)}", "status": "error"}

def get_honeypots():
    honeypots = db.honeypots
    return list(honeypots.find({}, {"_id": 0}))

def update_honeypot(name, updated_config):
    honeypots = db.honeypots
    honeypots.update_one({"name": name}, {"$set": updated_config})
    return {"message": "Honeypot updated successfully"}

def delete_honeypot(name):
    try:
        # Remove from Docker
        container = docker_client.containers.get(name)
        container.stop()
        container.remove()

        # Remove from database
        honeypots = db.honeypots
        honeypots.delete_one({"name": name})

        return {"message": f"Honeypot '{name}' deleted successfully"}
    except NotFound:
        return {"message": f"Honeypot '{name}' not found", "status": "not_found"}
    except APIError as e:
        return {"message": f"Failed to delete honeypot: {str(e)}", "status": "error"}
