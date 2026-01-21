import os
import json
from google.auth.transport.requests import Request
from google.oauth2.service_account import Credentials
from google.oauth2.credentials import Credentials as UserCredentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import io

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/drive.file']

def get_drive_service():
    """Shows basic usage of the Drive v3 API."""
    creds = None
    token_file = 'token.json'

    # 1. Check for Environment Variable (Priority for Vercel/Production)
    # Variable name: GOOGLE_TOKEN_JSON
    env_token = os.getenv('GOOGLE_TOKEN_JSON')
    if env_token:
        try:
            token_info = json.loads(env_token)
            creds = UserCredentials.from_authorized_user_info(token_info, SCOPES)
        except Exception as e:
            print(f"Error loading token from env: {e}")

    # 2. Check for token.json (Local Development)
    if not creds and os.path.exists(token_file):
        try:
            creds = UserCredentials.from_authorized_user_file(token_file, SCOPES)
        except Exception as e:
            print(f"Error loading token.json: {e}")

    # 3. Refresh if expired
    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
        except Exception as e:
            print(f"Error refreshing token: {e}")
            # In production/Vercel, we can't easily save back the refreshed token 
            # unless we use a database or external store. 
            # But the refresh should work for the current session.

    # 4. Fallback to Service Account (Legacy/Alternative)
    if not creds:
        # Check Env for Service Account
        sa_env = os.getenv('GOOGLE_CREDENTIALS_JSON')
        if sa_env:
             try:
                creds_dict = json.loads(sa_env)
                creds = Credentials.from_service_account_info(creds_dict, scopes=SCOPES)
             except: pass
        
        # Check File
        if not creds and os.path.exists('credentials.json'):
            creds = Credentials.from_service_account_file('credentials.json', scopes=SCOPES)

    if not creds:
        print("No valid credentials found.")
        return None

    return build('drive', 'v3', credentials=creds)

def upload_file_to_drive(file_content, filename, mimetype, folder_id=None):
    service = get_drive_service()
    if not service:
        return None

    file_metadata = {'name': filename}
    if folder_id:
        file_metadata['parents'] = [folder_id]

    media = MediaIoBaseUpload(io.BytesIO(file_content), mimetype=mimetype, resumable=True)

    # supportsAllDrives=True is needed for some shared folder types
    file = service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id, webViewLink, webContentLink',
        supportsAllDrives=True
    ).execute()
    
    return file
