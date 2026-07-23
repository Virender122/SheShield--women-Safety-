"""
Twilio SMS Service — SheShield Backend
Equivalent to the sendSOSSMS function in server.js
"""
import os
import asyncio
import logging

logger = logging.getLogger("sheshield.twilio")


def get_twilio_client():
    """
    Returns a Twilio client if credentials are configured, otherwise None.
    Matches getTwilioClient() in server.js.
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "")

    if account_sid and auth_token and account_sid != "your_twilio_account_sid":
        from twilio.rest import Client
        return Client(account_sid, auth_token)
    return None


async def send_sos_call(to_phone: str, to_name: str, user_name: str, lat: str, lon: str) -> dict:
    """
    Make an SOS Voice Call to a guardian. Runs synchronous Twilio call in a thread pool.
    """
    client = get_twilio_client()
    if not client:
        logger.warning(f"⚠️  Twilio not configured - skipping call for {to_name}")
        return {"success": False, "error": "Twilio not configured"}

    # Ensure E.164 formatting (prepend +91 if 10 digits)
    formatted_to_phone = to_phone.strip()
    if len(formatted_to_phone) == 10 and formatted_to_phone.isdigit():
        formatted_to_phone = f"+91{formatted_to_phone}"
    elif not formatted_to_phone.startswith("+"):
        formatted_to_phone = f"+{formatted_to_phone}"

    twiml = (
        f"<Response><Say voice='alice'>"
        f"Emergency SOS Alert. {user_name} has triggered an S O S and needs immediate help. "
        f"Dear {to_name}, please check on them immediately. Their live location is available on the app."
        f"</Say></Response>"
    )

    maps_link = f"https://www.google.com/maps?q={lat},{lon}"
    message_body = (
        f"🚨 EMERGENCY SOS ALERT 🚨\n"
        f"{user_name} has triggered an SOS and needs immediate help.\n\n"
        f"Dear {to_name},\n"
        f"Please check on them. Live Location:\n"
        f"{maps_link}"
    )

    try:
        loop = asyncio.get_event_loop()
        
        # 1. Send SMS (Most reliable for Twilio Trials in India)
        message = await loop.run_in_executor(
            None,
            lambda: client.messages.create(
                body=message_body,
                from_=os.getenv("TWILIO_PHONE_NUMBER"),
                to=formatted_to_phone,
            ),
        )
        logger.info(f"📱 SOS SMS sent to {formatted_to_phone}: {message.sid}")

        # 2. Make Voice Call
        call = await loop.run_in_executor(
            None,
            lambda: client.calls.create(
                twiml=twiml,
                from_=os.getenv("TWILIO_PHONE_NUMBER"),
                to=formatted_to_phone,
            ),
        )
        logger.info(f"📞 SOS Call sent to {formatted_to_phone}: {call.sid}")
        
        return {"success": True, "messageId": message.sid}
    except Exception as e:
        logger.error(f"❌ Failed to send SOS Alert to {to_phone}: {e}")
        return {"success": False, "error": str(e)}


async def send_incident_sms(client, incident_data: dict, media_url: str) -> None:
    """
    Send incident report SMS to authority phone number.
    Fire-and-forget, matches the incident SMS logic in server.js.
    """
    authority_phone = os.getenv("AUTHORITY_PHONE_NUMBER", "")
    if not client or not authority_phone or authority_phone == "your_authority_phone_number":
        return

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5005")
    full_media_url = f"{frontend_url}{media_url}" if media_url else "No media attached"

    message_body = (
        f"🚨 INCIDENT REPORT: {incident_data.get('title', '')} 🚨\n"
        f"Type: {incident_data.get('type', '')}\n"
        f"Severity: {incident_data.get('severity', '')}\n"
        f"Location: {incident_data.get('location', '')}\n"
        f"Desc: {incident_data.get('description', '')}\n"
        f"Media: {full_media_url}"
    )

    try:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            lambda: client.messages.create(
                body=message_body,
                from_=os.getenv("TWILIO_PHONE_NUMBER"),
                to=authority_phone,
            ),
        )
    except Exception as e:
        logger.error(f"Failed to send authority SMS: {e}")
