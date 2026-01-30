import requests
import base64
from datetime import datetime, timedelta
from typing import Dict, Optional
from app.core.config import settings

class ZoomService:
    def __init__(self):
        self.account_id = settings.ZOOM_ACCOUNT_ID
        self.client_id = settings.ZOOM_CLIENT_ID
        self.client_secret = settings.ZOOM_CLIENT_SECRET
        self.base_url = "https://api.zoom.us/v2"
        self._access_token = None
        self._token_expiry = None
    
    def _get_access_token(self) -> str:
        if self._access_token and self._token_expiry and datetime.utcnow() < self._token_expiry:
            return self._access_token
        url = f"https://zoom.us/oauth/token?grant_type=account_credentials&account_id={self.account_id}"
        credentials = f"{self.client_id}:{self.client_secret}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        headers = {"Authorization": f"Basic {encoded_credentials}", "Content-Type": "application/x-www-form-urlencoded"}
        response = requests.post(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        self._access_token = data["access_token"]
        self._token_expiry = datetime.utcnow() + timedelta(seconds=data.get("expires_in", 3600) - 300)
        return self._access_token
    
    def create_meeting(self, topic: str, duration: int = 60, timezone: str = "Africa/Luanda", agenda: Optional[str] = None) -> Dict:
        token = self._get_access_token()
        url = f"{self.base_url}/users/me/meetings"
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        meeting_data = {"topic": topic, "type": 2, "duration": duration, "timezone": timezone, "settings": {"host_video": True, "participant_video": True, "join_before_host": False, "mute_upon_entry": True, "watermark": False, "audio": "both", "auto_recording": "cloud", "waiting_room": False, "approval_type": 2}}
        if agenda:
            meeting_data["agenda"] = agenda
        response = requests.post(url, json=meeting_data, headers=headers)
        response.raise_for_status()
        data = response.json()
        return {"meeting_id": str(data["id"]), "join_url": data["join_url"], "start_url": data["start_url"], "password": data.get("password", "")}

zoom_service = ZoomService()