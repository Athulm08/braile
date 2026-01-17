import gradio as gr
import cv2
import numpy as np
from PIL import Image
from preprocess import clean_image
from detector import detect_dots, group_dots_into_lines
from translator import BrailleTranslator
from ai_refiner import AIRefiner

translator = BrailleTranslator()
refiner = AIRefiner()

def process_workflow(image, mode):
    if image is None: return "", "", None

    img_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    debug_img = img_cv.copy()

    is_photo = (mode == "Real Photo (Embossed)")
    thresh = clean_image(img_cv, is_photo)

    dots = detect_dots(thresh)
    if not dots: return "No dots found", "", None

    lines = group_dots_into_lines(dots)
    
    # Calculate average dot width to help with scaling
    avg_dot_w = sum(d[2] for d in dots) / len(dots)

    final_text = ""
    for line in lines:
        line.sort(key=lambda k: k[0])
        
        # INCREASED GAP: Stops 'h' from splitting into 'cc'
        gap_threshold = avg_dot_w * 4.0 

        cluster, last_x = [], line[0][0]
        for dot in line:
            dist = dot[0] - last_x
            if dist > gap_threshold:
                char, rect = translator.decode_cell(cluster, avg_dot_w)
                final_text += char
                cv2.rectangle(debug_img, (rect[0], rect[1]), (rect[2], rect[3]), (0, 255, 0), 2)
                cluster = []