#braile/backend/src/ai_refiner.py
from transformers import pipeline
import torch
import warnings

# Suppress unnecessary warnings from the transformers library
warnings.filterwarnings("ignore")

class AIRefiner:
    def __init__(self):
        # Determine if we can use a GPU
        self.device = 0 if torch.cuda.is_available() else -1
        
        print(f"[*] Initializing AI Refiner on {'GPU' if self.device == 0 else 'CPU'}...")
        
        try:
            # Using flan-t5-base for high-quality text-to-text correction
            self.model = pipeline(
                "text2text-generation", 
                model="google/flan-t5-base", 
                device=self.device
            )
            print("[+] AI Model loaded successfully.")
        except Exception as e:
            print(f"[-] AI Model failed to load: {e}")
            self.model = None

    def fix_text(self, text):
        """
        Uses Deep Learning to fix translation artifacts and spelling.
        """
        if not text or len(text.strip()) < 2:
            return text
            
        if not self.model:
            return text

        # A more structured prompt helps the model understand its specific task
        prompt = (
            f"Task: Correct the spelling and formatting of this Braille-to-English translation. "
            f"If it's a single word, just provide the word. "
            f"Text: {text}"
        )

        try:
            # Generate the correction
            result = self.model(
                prompt, 
                max_length=128, 
                num_beams=4, 
                early_stopping=True
            )
            
            corrected = result[0]['generated_text']
            
            # Post-processing: Remove AI chatter and clean up
            # (Sometimes T5 adds "The text is:" or quotes)
            clean_output = corrected.replace("The text is:", "").replace("Corrected text:", "").strip()
            clean_output = clean_output.strip('"').strip("'")
            
            # If the AI produces an empty result, return the original
            return clean_output if clean_output else text
            
        except Exception as e:
            print(f"Error during AI refinement: {e}")
            return text