# braile/backend/src/preprocess.py

import cv2
import numpy as np

def clean_image(img, is_photo_mode=True):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    if is_photo_mode:
        # 1. Equalize lighting across the curved page/shadows
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        
        # 2. Blur to remove paper texture and grain
        blurred = cv2.GaussianBlur(enhanced, (5, 5), 0)
        
        # 3. Adaptive Thresholding: Block size 41 adapts to large shadow gradients
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY_INV, 41, 12
        )
        
        # 4. CRITICAL: Embossed bumps have a light and dark side. 
        # Strong Dilation merges the split shadow/highlight into ONE solid dot.
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        thresh = cv2.dilate(thresh, kernel, iterations=2)
        
        # 5. Erode to clean up stray noise/dust from the paper
        thresh = cv2.erode(thresh, kernel, iterations=1)
        
    else:
        # Digital Mode
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
        kernel_clean = np.ones((2, 2), np.uint8)
        thresh = cv2.dilate(thresh, kernel_clean, iterations=1)
        
    return thresh