import os
import json
import base64
from bs4 import BeautifulSoup
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

TOKEN_PATH = os.getenv('GMAIL_TOKEN_PATH', 'token.json')  # Path configurable via variable d'environnement
OUTPUT_FILE = 'plannings.json'

def get_service():
    creds = Credentials.from_authorized_user_file(TOKEN_PATH)
    service = build('gmail', 'v1', credentials=creds)
    return service

def get_body_from_part(part):
    data = part['body'].get('data')
    if data:
        return base64.urlsafe_b64decode(data).decode(errors="ignore")
    return ""

def get_html_parts(payload):
    html_parts = []
    if 'parts' in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/html':
                body = get_body_from_part(part)
                if body:
                    html_parts.append(body)
            elif 'parts' in part:
                html_parts.extend(get_html_parts(part))
    else:
        if payload['mimeType'] == 'text/html':
            body = get_body_from_part(payload)
            if body:
                html_parts.append(body)
    return html_parts

def parse_planning(html):
    soup = BeautifulSoup(html, 'html.parser')
    table = soup.find('table')
    if not table:
        return []
    planning = []
    for row in table.find_all('tr'):
        cells = [td.get_text(strip=True) for td in row.find_all('td')]
        if cells:
            planning.append(cells)
    return planning

def fetch_emails(service):
    results = service.users().messages().list(userId='me', labelIds=['INBOX']).execute()
    messages = results.get('messages', [])
    plannings = []

    for msg in messages:
        message = service.users().messages().get(userId='me', id=msg['id']).execute()
        payload = message['payload']
        html_parts = get_html_parts(payload)
        mail_planning = []
        for html in html_parts:
            mail_planning.extend(parse_planning(html))
        plannings.append({
            "id": msg['id'],
            "planning": mail_planning
        })
    return plannings

def main():
    service = get_service()
    plannings = fetch_emails(service)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(plannings, f, ensure_ascii=False, indent=2)
    print(f"{len(plannings)} mails récupérés et plannings extraits dans {OUTPUT_FILE}.")


if __name__ == "__main__":
    main()
