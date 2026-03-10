from transformers import pipeline
import torch
import warnings
import asyncio
from googletrans import Translator

# Suppress unnecessary warnings
warnings.filterwarnings("ignore")

class AIRefiner:
    def __init__(self): 
        # Detect if GPU is available
        self.device = 0 if torch.cuda.is_available() else -1
        print(f"[*] Initializing AI Refiner on {'GPU' if self.device == 0 else 'CPU'}...")
        
        # 1. Initialize the AI Model (Flan-T5)
        try:
            self.model = pipeline(
                "text2text-generation", 
                model="google/flan-t5-base", 
                device=self.device
            )
            print("[+] AI Model loaded successfully.")
        except Exception as e:
            print(f"[-] AI Model loading failed: {e}")
            self.model = None

        # 2. Initialize the Translator independently
        try:
            self.translator_engine = Translator()
            print("[+] Googletrans engine initialized.")
        except Exception as e:
            print(f"[-] Translator initialization failed: {e}")
            self.translator_engine = None

    def fix_text(self, text):
        """Clean English Braille-to-Text artifacts using Flan-T5."""
        if not text or len(text.strip()) < 2:
            return text
        if not self.model:
            return text

        prompt = f"Correct spelling and grammar: {text}"

        try:
            result = self.model(prompt, max_length=128, num_beams=4, early_stopping=True)
            corrected = result[0]['generated_text']
            clean_output = corrected.replace("The text is:", "").replace("Corrected text:", "").strip()
            return clean_output if clean_output else text
        except Exception as e:
            print(f"Error during AI refinement: {e}")
            return text

    def translate_text(self, text, target_lang='hindi'):
        """Translates Refined English to target language using googletrans."""
        if not text or not self.translator_engine:
            return text

        lang_input = target_lang.lower().strip()
        if lang_input == 'english':
            return text

        # Mapping for googletrans
        lang_map = {
            "hindi": "hi", "tamil": "ta", "telugu": "te", "malayalam": "ml",
            "marathi": "mr", "bengali": "bn", "kannada": "kn", "gujarati": "gu",
            "punjabi": "pa", "french": "fr", "spanish": "es", "german": "de", "arabic": "ar"
        }

        lang_code = lang_map.get(lang_input, lang_input)

        try:
            # googletrans version 4.0.0-rc1 is the most stable
            translated = self.translator_engine.translate(text, dest=lang_code)
            
            # Handle potential async returns in some environments
            if asyncio.iscoroutine(translated):
                translated = asyncio.run(translated)

            return translated.text
        except Exception as e:
            print(f"Googletrans error for {target_lang}: {e}")
            return text