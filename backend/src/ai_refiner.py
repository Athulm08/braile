from transformers import pipeline
import torch
import warnings
from googletrans import Translator  # <--- Changed to googletrans

# Suppress unnecessary warnings
warnings.filterwarnings("ignore")

class AIRefiner:
    def __init__(self): 
        # Detect if GPU is available
        self.device = 0 if torch.cuda.is_available() else -1
        print(f"[*] Initializing AI Refiner on {'GPU' if self.device == 0 else 'CPU'}...")
        
        try:
            # Load Flan-T5 for English text correction
            self.model = pipeline(
                "text2text-generation", 
                model="google/flan-t5-base", 
                device=self.device
            )
            self.translator_engine = Translator() # Initialize googletrans
            print("[+] AI Model and Translator loaded successfully.")
        except Exception as e:
            print(f"[-] Initialization failed: {e}")
            self.model = None

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
            
            # Clean up T5 specific prefixes
            clean_output = corrected.replace("The text is:", "").replace("Corrected text:", "").strip()
            return clean_output if clean_output else text
        except Exception as e:
            print(f"Error during AI refinement: {e}")
            return text

    def translate_text(self, text, target_lang='hindi'):
        """
        Translates Refined English to target language using googletrans.
        """
        lang_input = target_lang.lower().strip()
        
        if not text or lang_input == 'english':
            return text

        # Mapping for googletrans
        lang_map = {
            "hindi": "hi",
            "tamil": "ta",
            "telugu": "te",
            "malayalam": "ml",
            "marathi": "mr",
            "bengali": "bn",
            "kannada": "kn",
            "gujarati": "gu",
            "punjabi": "pa",
            "french": "fr",
            "spanish": "es",
            "german": "de",
            "arabic": "ar"
        }

        lang_code = lang_map.get(lang_input, lang_input)

        try:
            # Usage: translator.translate(text, dest='lang_code')
            # googletrans handles the 'en' source detection automatically
            translated = self.translator_engine.translate(text, dest=lang_code)
            return translated.text
        except Exception as e:
            print(f"Googletrans error for {target_lang}: {e}")
            return text