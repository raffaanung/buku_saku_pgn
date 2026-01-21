from services.drive_service import upload_file_to_drive, get_drive_service
import os

def test_upload():
    print("Testing Drive Connection...")
    
    # 1. List files to verify connection
    service = get_drive_service()
    if not service:
        print("FAILED: Could not connect to Drive.")
        return

    print("Connection successful!")
    
    # 2. Try to upload a dummy file
    content = b"Hello Google Drive! This is a test file from Buku Saku."
    filename = "test_upload_buku_saku.txt"
    mimetype = "text/plain"
    folder_id = "1Gn44n4VoSvYtVB_n5lLGYSYLt3fzVcWG" # The ID user found earlier

    print(f"Attempting to upload '{filename}' to folder '{folder_id}'...")
    
    try:
        result = upload_file_to_drive(content, filename, mimetype, folder_id)
        if result:
            print(f"SUCCESS: File uploaded! ID: {result.get('id')}")
            print(f"Web View Link: {result.get('webViewLink')}")
        else:
            print("FAILED: Upload returned None.")
    except Exception as e:
        print(f"FAILED: Exception during upload: {e}")

if __name__ == "__main__":
    test_upload()
