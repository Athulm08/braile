import os
import time
import cv2
import numpy as np
import gradio as gr
from PIL import Image

# Your existing imports
from preprocess import clean_image
from detector import detect_dots, group_dots_into_lines
from translator import BrailleTranslator
from ai_refiner import AIRefiner

# --- NEW: FOLDER SETUP ---
# This code ensures the folders exist as soon as you start the app
DATA_INPUT_DIR = "data/input"
DATA_OUTPUT_DIR = "data/output"

for folder in [DATA_INPUT_DIR, DATA_OUTPUT_DIR]:
    if not os.path.exists(folder):
        os.makedirs(folder)

translator = BrailleTranslator()
refiner = AIRefiner()

def process_workflow(image, mode):
    if image is None: return "", "", None
    
    # Generate a unique filename based on current time
    timestamp = int(time.time())
    input_path = os.path.join(DATA_INPUT_DIR, f"scan_{timestamp}.jpg")
    output_path = os.path.join(DATA_OUTPUT_DIR, f"result_{timestamp}.jpg")

    # 1. Save the Raw Input to data/input/
    image.save(input_path)
    
    # 2. Convert to OpenCV for processing
    img_cv = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    debug_img = img_cv.copy()
    
    is_photo = (mode == "Real Photo (Embossed)")
    thresh = clean_image(img_cv, is_photo)
    
    dots = detect_dots(thresh)
    if not dots: return "No dots found", "", None
    
    lines = group_dots_into_lines(dots)
    avg_dot_w = sum(d[2] for d in dots) / len(dots)
    
    final_text = ""
    for line in lines:
        line.sort(key=lambda k: k[0])
        gap_limit = avg_dot_w * 4.0 
        
        cluster, last_x = [], line[0][0]
        for dot in line:
            if (dot[0] - last_x) > gap_limit:
                char, rect = translator.decode_cell(cluster, avg_dot_w)
                final_text += char
                cv2.rectangle(debug_img, (rect[0], rect[1]), (rect[2], rect[3]), (0, 255, 0), 2)
                cluster = []
            cluster.append(dot)
            last_x = dot[0]
        
        if cluster:
            char, rect = translator.decode_cell(cluster, avg_dot_w)
            final_text += char
            cv2.rectangle(debug_img, (rect[0], rect[1]), (rect[2], rect[3]), (0, 255, 0), 2)
        final_text += "\n"

    # 3. Save the Processed Visualization to data/output/
    cv2.imwrite(output_path, debug_img)

    raw_output = final_text.strip()
    ai_output = refiner.fix_text(raw_output)
    
    return raw_output, ai_output, cv2.cvtColor(debug_img, cv2.COLOR_BGR2RGB)

# ... (rest of your Gradio UI code remains the same)