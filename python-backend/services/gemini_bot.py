"""
Google Gemini AI Chatbot Service — SheShield Backend
Equivalent to the /api/bot/chat handler in server.js
"""
import os
import asyncio
import logging

logger = logging.getLogger("sheshield.gemini")

# System instruction — identical to server.js
SYSTEM_INSTRUCTION = (
    "You are the 'SheShield Safety Assistant', a supportive, empathetic, and knowledgeable "
    "AI companion integrated into a women's safety app. Your main goal is to provide safety "
    "advice, emergency preparedness tips, emotional support, and general guidance. Keep responses "
    "concise, helpful, and reassuring. Do not hallucinate emergency services phone numbers; "
    "instead, tell them to use the SOS button or call local authorities."
)


async def chat_with_gemini(message: str, history: list = None) -> str:
    """
    Send a message to Gemini and return the response text.
    Matches the chat logic in server.js /api/bot/chat endpoint.
    """
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not configured in backend.")

    import google.generativeai as genai

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=SYSTEM_INSTRUCTION,
    )

    # Format history for Gemini — same logic as server.js
    formatted_history = []
    if history:
        for msg in history:
            role = "user" if msg.get("role") == "user" else "model"
            formatted_history.append({
                "role": role,
                "parts": [{"text": msg.get("text", "")}],
            })

    # Gemini requires the first message in history to be from 'user' — same fix as server.js
    while formatted_history and formatted_history[0]["role"] == "model":
        formatted_history.pop(0)

    chat = model.start_chat(history=formatted_history)

    # Run synchronous Gemini call in thread pool
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, lambda: chat.send_message(message))
    return result.text
