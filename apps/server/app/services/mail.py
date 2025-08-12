import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_mail(to_address: str, subject: str, body: str) -> None:
    """Send an email using SMTP.

    Uses configuration from :mod:`app.core.config`.
    If username and password are provided, TLS login is performed.
    """
    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = to_address
    message["Subject"] = subject
    message.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        if settings.smtp_username and settings.smtp_password:
            try:
                server.starttls()
            except Exception:
                pass
            server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(message)
