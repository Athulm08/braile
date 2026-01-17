import cv2
import numpy as np

def clean_image(img, is_photo_mode=True):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    if is_photo_mode:
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
        tophat = cv2.morphologyEx(gray, cv2.MORPH_TOPHAT, kernel)
        clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(tophat)
        _, thresh = cv2.threshold(enhanced, 50, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    else:
        # Optimized for your digital hello image
        _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)
    
    kernel_clean = np.ones((2, 2), np.uint8)
    return cv2.dilate(thresh, kernel_clean, iterations=1)