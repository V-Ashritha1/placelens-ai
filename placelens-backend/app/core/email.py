import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings


def send_verification_email(to_email: str, full_name: str, raw_token: str) -> None:
    verify_link = f"{settings.FRONTEND_URL}/verify-email?token={raw_token}"

    message = MIMEMultipart()
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = to_email
    message["Subject"] = "Verify your PlaceLens AI account"

    body = (
        f"Hi {full_name},\n\n"
        "Thanks for signing up for PlaceLens AI. Please verify your email address "
        f"by clicking the link below:\n\n{verify_link}\n\n"
        "This link expires in 24 hours. If you didn't create this account, "
        "you can safely ignore this email.\n\n"
        "— PlaceLens AI"
    )
    message.attach(MIMEText(body, "plain"))

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, to_email, message.as_string())