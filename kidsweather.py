#!/usr/bin/env python3

import subprocess
import smtplib
from email.mime.text import MIMEText
from datetime import datetime

# ----------------------------
# CONFIGURATION
# ----------------------------
SENDER_EMAIL = "sender@example.com"
SENDER_APP_PASSWORD = "YOUR_EMAIL_APP_PASSWORD"
RECEIVER_EMAIL = "team@example.com"

WEATHER_URL = "http://192.168.1.211:3000"
REPORT_NAME = "Weather Forecast Report"
# ----------------------------

def get_weather_report(url):
    """
    Fetches the weather page with curl and renders it as readable text with w3m.
    """
    try:
        curl_result = subprocess.run(
            ["curl", "-s", url],
            text=True,
            capture_output=True,
            check=True
        )

        w3m_result = subprocess.run(
            ["w3m", "-dump", "-T", "text/html"],
            input=curl_result.stdout,
            text=True,
            capture_output=True,
            check=True
        )

        output = w3m_result.stdout.strip()
        if not output:
            return "Weather report returned no output."

        return output

    except subprocess.CalledProcessError as e:
        return (
            "Error generating weather report:\n"
            f"Command: {e.cmd}\n"
            f"Return Code: {e.returncode}\n"
            f"STDOUT:\n{e.stdout}\n"
            f"STDERR:\n{e.stderr}"
        )
    except FileNotFoundError as e:
        return f"Required command not found: {e}"
    except Exception as e:
        return f"Unexpected error while generating weather report:\n{e}"

def send_email(subject, body):
    """
    Sends email using SMTP.
    """
    msg = MIMEText(body)
    msg["From"] = SENDER_EMAIL
    msg["To"] = RECEIVER_EMAIL
    msg["Subject"] = subject

    smtp_server = "smtp.mail.me.com"
    smtp_port = 587

    try:
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_APP_PASSWORD)
            server.send_message(msg)
        print("Email sent successfully.")
    except Exception as e:
        print(f"Error sending email: {e}")

def main():
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    subject = f"{REPORT_NAME} - {now}"

    report_output = get_weather_report(WEATHER_URL)

    print("\n=== Report Output ===")
    print(report_output)
    print("=====================\n")

    send_email(subject, report_output)

if __name__ == "__main__":
    main()
