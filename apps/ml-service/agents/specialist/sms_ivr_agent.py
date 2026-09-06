import time
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from typing import Dict, Optional, Any

try:
    from agents.base import BaseAgent, AgentInput, AgentOutput
except ImportError:
    class BaseAgent:
        def __init__(self, config=None):
            self.config = config or {}
        async def process(self, input_data: 'AgentInput') -> 'AgentOutput':
            raise NotImplementedError
        async def health_check(self) -> Dict[str, Any]:
            return {"status": "healthy"}

    @dataclass
    class AgentInput:
        query: str
        language: str = "en"
        user_id: Optional[str] = None
        context: dict = field(default_factory=dict)
        data: Any = None

    @dataclass
    class AgentOutput:
        status: str
        data: dict
        message: str
        confidence: float = 1.0


@dataclass
class Session:
    phone: str
    language: str = 'en'
    current_intent: Optional[str] = None
    step: str = 'IDLE'
    collected_data: dict = field(default_factory=dict)
    created_at: float = field(default_factory=time.time)
    last_active: float = field(default_factory=time.time)


class SessionStore:
    def __init__(self, ttl_seconds: int = 1800):
        self.sessions: Dict[str, Session] = {}
        self.ttl_seconds = ttl_seconds

    def get_or_create(self, phone: str) -> Session:
        now = time.time()
        if phone in self.sessions:
            session = self.sessions[phone]
            if now - session.last_active > self.ttl_seconds:
                # Session expired
                self.sessions[phone] = Session(phone=phone)
            else:
                session.last_active = now
        else:
            self.sessions[phone] = Session(phone=phone)
        return self.sessions[phone]

    def update(self, phone: str, updates: dict):
        if phone in self.sessions:
            session = self.sessions[phone]
            for k, v in updates.items():
                setattr(session, k, v)
            session.last_active = time.time()


class SMSIVRAgent(BaseAgent):
    """
    SMSIVRAgent handles multi-turn feature-phone conversations for SMS and IVR.
    """
    @property
    def name(self) -> str:
        return "SMSIVRAgent"

    @property
    def description(self) -> str:
        return "Handles multi-turn feature-phone conversations for SMS and IVR."

    def __init__(self, config: Optional[dict] = None):
        super().__init__(config)
        self.session_store = SessionStore()
        
        # Multi-language prompts
        self.prompts = {
            'LANGUAGE_SELECT': {
                'en': 'Reply EN for English, HI for Hindi, TA for Tamil.',
                'hi': 'Hindi ke liye HI likhein, English ke liye EN.',
                'ta': 'Tamil ku TA endru anuppavum.'
            },
            'INTENT_SELECT': {
                'en': 'Reply 1 for Disease, 2 for Price, 3 for Weather, 4 for Expert.',
                'hi': 'Bemari ke liye 1, Daam ke liye 2, Mausam ke liye 3, Expert ke liye 4 dabayein.',
                'ta': 'Noi 1, Vilai 2, Vaanilai 3, Vallunar 4.'
            },
            'DATA_COLLECT_CROP': {
                'en': 'Please reply with the crop name.',
                'hi': 'Fasal ka naam likhein.',
                'ta': 'Payir peyarai anuppavum.'
            },
            'DATA_COLLECT_LOC': {
                'en': 'Please reply with your district or pincode.',
                'hi': 'Apna zila ya pincode likhein.',
                'ta': 'Mavattam allathu pincode anuppavum.'
            },
            'FOLLOW_UP': {
                'en': 'Reply 1 to go back to main menu, or exit.',
                'hi': 'Main menu ke liye 1 dabayein.',
                'ta': 'Main menu ku 1 anuppavum.'
            }
        }

    def _get_or_create_session(self, phone: str) -> Session:
        return self.session_store.get_or_create(phone)

    def _update_session(self, phone: str, updates: dict):
        self.session_store.update(phone, updates)

    def _route_session(self, session: Session, message: str, digit: Optional[str]) -> str:
        """State machine for session routing."""
        step = session.step
        lang = session.language
        text_input = digit if digit else message.strip().upper()

        if step == 'IDLE' or text_input in ['HI', 'HELLO', 'START']:
            self._update_session(session.phone, {'step': 'LANGUAGE_SELECT'})
            return self.prompts['LANGUAGE_SELECT']['en']

        if step == 'LANGUAGE_SELECT':
            if text_input in ['EN', 'HI', 'TA']:
                lang = text_input.lower()
                self._update_session(session.phone, {'language': lang, 'step': 'INTENT_SELECT'})
                return self.prompts['INTENT_SELECT'][lang]
            return self.prompts['LANGUAGE_SELECT']['en']

        if step == 'INTENT_SELECT':
            intent_map = {'1': 'disease', '2': 'price', '3': 'weather', '4': 'expert'}
            if text_input in intent_map:
                intent = intent_map[text_input]
                self._update_session(session.phone, {'current_intent': intent, 'step': 'DATA_COLLECT_CROP'})
                return self.prompts['DATA_COLLECT_CROP'][lang]
            return self.prompts['INTENT_SELECT'][lang]

        if step == 'DATA_COLLECT_CROP':
            collected = session.collected_data
            collected['crop'] = text_input
            self._update_session(session.phone, {'collected_data': collected, 'step': 'DATA_COLLECT_LOC'})
            return self.prompts['DATA_COLLECT_LOC'][lang]

        if step == 'DATA_COLLECT_LOC':
            collected = session.collected_data
            collected['location'] = text_input
            self._update_session(session.phone, {'collected_data': collected, 'step': 'PROCESSING'})
            
            # Here it would call MasterOrchestrator, but we return a mock success for now
            # In a real async flow, we would await the orchestrator call.
            res = f"Data processed for {collected.get('crop')} at {collected.get('location')}."
            self._update_session(session.phone, {'step': 'FOLLOW_UP'})
            return f"{res}\n{self.prompts['FOLLOW_UP'][lang]}"
            
        if step == 'FOLLOW_UP':
            if text_input == '1':
                self._update_session(session.phone, {'step': 'INTENT_SELECT', 'collected_data': {}})
                return self.prompts['INTENT_SELECT'][lang]
            
            self._update_session(session.phone, {'step': 'IDLE'})
            return "Thank you. Goodbye."

        return "Invalid state."

    def _format_sms(self, result: str, lang: str) -> str:
        """Formats string to standard SMS length (160 max), simplified."""
        # A real implementation might split messages and append '(1/2)'
        if len(result) > 160:
            return result[:157] + "..."
        return result

    def _format_ivr(self, result: str, lang: str) -> str:
        """Format text for Text-To-Speech (remove special characters)."""
        clean = result.replace('\n', ' ').replace('*', '')
        return clean

    def _generate_twiml(self, text: str, gather_digits: bool = False) -> str:
        """Generates valid TwiML XML string."""
        response = ET.Element('Response')
        if gather_digits:
            gather = ET.SubElement(response, 'Gather', numDigits="1", timeout="10")
            say = ET.SubElement(gather, 'Say')
            say.text = text
        else:
            say = ET.SubElement(response, 'Say')
            say.text = text
            
        return ET.tostring(response, encoding='unicode')

    async def process(self, input_data: AgentInput) -> AgentOutput:
        """
        Main processing method. Expects 'context' to contain phone, message, etc.
        """
        ctx = input_data.context
        phone = ctx.get('phone', 'unknown')
        message = ctx.get('message', '')
        channel = ctx.get('channel', 'sms')
        digit = ctx.get('digit_pressed')

        session = self._get_or_create_session(phone)
        raw_response = self._route_session(session, message, digit)

        if channel == 'sms':
            final_resp = self._format_sms(raw_response, session.language)
            data = {"text": final_resp}
        else:
            final_resp = self._format_ivr(raw_response, session.language)
            needs_digit = session.step in ['LANGUAGE_SELECT', 'INTENT_SELECT', 'FOLLOW_UP']
            twiml = self._generate_twiml(final_resp, gather_digits=needs_digit)
            data = {"twiml": twiml}

        return AgentOutput(
            status="success",
            data=data,
            message="Interaction processed"
        )
