"""
Multilingual response formatter for KisanSeva agents.
Provides translation templates and formatted output for EN/HI/TA/TE/KN/BN.
"""
from __future__ import annotations

import textwrap
from dataclasses import dataclass, field
from typing import Dict, List, Optional

# ─── Supported languages ──────────────────────────────────
SUPPORTED_LANGUAGES = {"en", "hi", "ta", "te", "kn", "bn", "mr", "gu"}

# ─── UI string translations ────────────────────────────────
UI_STRINGS: Dict[str, Dict[str, str]] = {
    "greeting": {
        "en": "Hello! How can I help you today?",
        "hi": "नमस्ते! आज मैं आपकी कैसे मदद कर सकता हूँ?",
        "ta": "வணக்கம்! இன்று உங்களுக்கு எப்படி உதவலாம்?",
        "te": "నమస్కారం! నేను మీకు ఎలా సహాయం చేయగలను?",
        "kn": "ನಮಸ್ಕಾರ! ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
        "bn": "নমস্কার! আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
    },
    "disease_detected": {
        "en": "Disease Detected",
        "hi": "रोग पाया गया",
        "ta": "நோய் கண்டறியப்பட்டது",
        "te": "వ్యాధి గుర్తించబడింది",
        "kn": "ರೋಗ ಪತ್ತೆಯಾಗಿದೆ",
        "bn": "রোগ সনাক্ত হয়েছে",
    },
    "healthy_plant": {
        "en": "Plant Appears Healthy",
        "hi": "पौधा स्वस्थ दिखता है",
        "ta": "தாவரம் ஆரோக்கியமாக உள்ளது",
        "te": "మొక్క ఆరోగ్యంగా కనిపిస్తుంది",
        "kn": "ಸಸ್ಯ ಆರೋಗ್ಯಕರವಾಗಿ ಕಾಣುತ್ತದೆ",
        "bn": "গাছ সুস্থ দেখাচ্ছে",
    },
    "immediate_treatment": {
        "en": "Immediate Treatment",
        "hi": "तत्काल उपचार",
        "ta": "உடனடி சிகிச்சை",
        "te": "తక్షణ చికిత్స",
        "kn": "ತಕ್ಷಣದ ಚಿಕಿತ್ಸೆ",
        "bn": "তাৎক্ষণিক চিকিৎসা",
    },
    "prevention": {
        "en": "Prevention Tips",
        "hi": "बचाव के उपाय",
        "ta": "தடுப்பு குறிப்புகள்",
        "te": "నివారణ చిట్కాలు",
        "kn": "ತಡೆಗಟ್ಟುವ ಸಲಹೆಗಳು",
        "bn": "প্রতিরোধ টিপস",
    },
    "organic_alternative": {
        "en": "Organic Alternative",
        "hi": "जैविक विकल्प",
        "ta": "இயற்கை மாற்று",
        "te": "సేంద్రీయ ప్రత్యామ్నాయం",
        "kn": "ಸಾವಯವ ಪರ್ಯಾಯ",
        "bn": "জৈব বিকল্প",
    },
    "best_price_today": {
        "en": "Best Price Today",
        "hi": "आज का सर्वोत्तम भाव",
        "ta": "இன்றைய சிறந்த விலை",
        "te": "ఈరోజు అత్యుత్తమ ధర",
        "kn": "ಇಂದಿನ ಅತ್ಯುತ್ತಮ ಬೆಲೆ",
        "bn": "আজকের সেরা দাম",
    },
    "irrigate_today": {
        "en": "Irrigate Today",
        "hi": "आज सिंचाई करें",
        "ta": "இன்று நீர்ப்பாசனம் செய்யுங்கள்",
        "te": "ఈరోజు నీరు పెట్టండి",
        "kn": "ಇಂದು ನೀರಾವರಿ ಮಾಡಿ",
        "bn": "আজ সেচ দিন",
    },
    "confidence": {
        "en": "Confidence",
        "hi": "विश्वास स्तर",
        "ta": "நம்பகத்தன்மை",
        "te": "నమ్మకం",
        "kn": "ವಿಶ್ವಾಸ",
        "bn": "আস্থা",
    },
    "escalate_notice": {
        "en": "⚠️ Low confidence — please consult your local Krishi Vigyan Kendra (KVK) or agriculture extension officer.",
        "hi": "⚠️ कम विश्वसनीयता — कृपया अपने स्थानीय कृषि विज्ञान केंद्र (KVK) या कृषि विस्तार अधिकारी से परामर्श करें।",
        "ta": "⚠️ குறைந்த நம்பகத்தன்மை — உங்கள் உள்ளூர் KVK அல்லது வேளாண் ஆலோசகரை தொடர்பு கொள்ளவும்.",
        "te": "⚠️ తక్కువ విశ్వసనీయత — దయచేసి మీ స్థానిక KVK లేదా వ్యవసాయ విస్తరణ అధికారిని సంప్రదించండి.",
        "kn": "⚠️ ಕಡಿಮೆ ವಿಶ್ವಾಸ — ದಯವಿಟ್ಟು ನಿಮ್ಮ ಸ್ಥಳೀಯ KVK ಅಥವಾ ಕೃಷಿ ವಿಸ್ತರಣ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.",
        "bn": "⚠️ কম আস্থা — অনুগ্রহ করে আপনার স্থানীয় KVK বা কৃষি সম্প্রসারণ কর্মকর্তার পরামর্শ নিন।",
    },
    "help_prompt": {
        "en": "Reply: PRICE [crop], WEATHER, PEST [crop] for free advisory. Call 1800-XXX-XXXX for voice advisory.",
        "hi": "जवाब दें: PRICE [फसल], WEATHER, PEST [फसल] — मुफ्त सलाह के लिए। आवाज़ सलाह के लिए 1800-XXX-XXXX पर कॉल करें।",
        "ta": "பதில் அளிக்கவும்: PRICE [பயிர்], WEATHER, PEST [பயிர்] — இலவச ஆலோசனைக்கு. குரல் ஆலோசனைக்கு 1800-XXX-XXXX அழைக்கவும்.",
        "te": "సమాధానం ఇవ్వండి: PRICE [పంట], WEATHER, PEST [పంట] — ఉచిత సలహా కోసం. వాయిస్ సలహా కోసం 1800-XXX-XXXX కి కాల్ చేయండి.",
        "kn": "ಉತ್ತರ ನೀಡಿ: PRICE [ಬೆಳೆ], WEATHER, PEST [ಬೆಳೆ] — ಉಚಿತ ಸಲಹೆಗಾಗಿ. ಧ್ವನಿ ಸಲಹೆಗಾಗಿ 1800-XXX-XXXX ಗೆ ಕರೆ ಮಾಡಿ.",
        "bn": "উত্তর দিন: PRICE [ফসল], WEATHER, PEST [ফসল] — বিনামূল্যে পরামর্শের জন্য। ভয়েস পরামর্শের জন্য 1800-XXX-XXXX এ কল করুন।",
    },
}


def t(key: str, lang: str = "en") -> str:
    """Translate a UI string key to the target language.

    Falls back to English if the language is not supported or the key
    does not exist in the target language.

    Args:
        key: Key into UI_STRINGS.
        lang: 2-letter language code.

    Returns:
        Translated string.
    """
    lang = lang.lower()[:2]
    if lang not in SUPPORTED_LANGUAGES:
        lang = "en"
    bucket = UI_STRINGS.get(key, {})
    return bucket.get(lang) or bucket.get("en", f"[{key}]")


def format_numbered_list(items: List[str], lang: str = "en") -> str:
    """Format a list of strings as a numbered advisory list.

    Args:
        items: Advisory strings.
        lang: Language code (currently unused; placeholder for RTL support).

    Returns:
        Multi-line string with 1. 2. 3. numbering.
    """
    return "\n".join(f"{i + 1}. {item}" for i, item in enumerate(items))


def format_sms_response(content: str, max_length: int = 160) -> str:
    """Truncate a response to fit within SMS length limits.

    If the content exceeds ``max_length``, it is truncated and a
    continuation code is appended so the farmer knows more is available.

    Args:
        content: Full advisory text.
        max_length: Maximum character count (default 160 for single SMS).

    Returns:
        SMS-safe string.
    """
    if len(content) <= max_length:
        return content
    truncated = content[: max_length - 10].rsplit(" ", 1)[0]
    return truncated + "... (1/2)"


def wrap_for_ivr(text: str, lang: str = "en") -> str:
    """Prepare text for Text-to-Speech (IVR) delivery.

    Strips markdown-style characters, expands abbreviations, and
    wraps currency symbols for TTS pronunciation.

    Args:
        text: Raw advisory text.
        lang: Language code.

    Returns:
        Clean string suitable for TTS engines (Polly / Google TTS).
    """
    replacements = {
        "₹": "rupees",
        "qtl": "quintal",
        "kg/ha": "kilograms per hectare",
        "mm": "millimetres",
        "WP": "wettable powder",
        "g/L": "grams per litre",
        "%": "percent",
        "→": "to",
        "🌿": "",
        "🧪": "",
        "✓": "",
        "⚠️": "Warning.",
        "•": ",",
        "-": " ",
    }
    for symbol, replacement in replacements.items():
        text = text.replace(symbol, replacement)

    # Wrap to ~80 chars for natural pause insertion
    return textwrap.fill(text.strip(), width=80)


def detect_language(text: str) -> str:
    """Heuristically detect language from script range.

    Uses Unicode block ranges to identify Devanagari, Tamil, Telugu,
    Kannada, and Bengali scripts.

    Args:
        text: Input text string.

    Returns:
        2-letter language code ('en', 'hi', 'ta', 'te', 'kn', 'bn').
    """
    # Count characters in each Unicode block
    counts: Dict[str, int] = {
        "hi": 0,  # Devanagari: U+0900–U+097F
        "ta": 0,  # Tamil:      U+0B80–U+0BFF
        "te": 0,  # Telugu:     U+0C00–U+0C7F
        "kn": 0,  # Kannada:    U+0C80–U+0CFF
        "bn": 0,  # Bengali:    U+0980–U+09FF
    }
    for ch in text:
        cp = ord(ch)
        if 0x0900 <= cp <= 0x097F:
            counts["hi"] += 1
        elif 0x0B80 <= cp <= 0x0BFF:
            counts["ta"] += 1
        elif 0x0C00 <= cp <= 0x0C7F:
            counts["te"] += 1
        elif 0x0C80 <= cp <= 0x0CFF:
            counts["kn"] += 1
        elif 0x0980 <= cp <= 0x09FF:
            counts["bn"] += 1

    best = max(counts, key=counts.get)  # type: ignore[arg-type]
    if counts[best] > 2:
        return best
    return "en"
