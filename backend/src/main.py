# braile/backend/src/main.py

import os
import time
import uvicorn
import cv2
import numpy as np
import base64
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

from preprocess import clean_image
from detector import detect_dots, group_dots_into_lines
from translator import BrailleTranslator
from ai_refiner import AIRefiner

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_INPUT_DIR = "data/input"
DATA_OUTPUT_DIR = "data/output"
for folder in [DATA_INPUT_DIR, DATA_OUTPUT_DIR]:
    os.makedirs(folder, exist_ok=True)

translator = BrailleTranslator()
refiner = AIRefiner()

@app.post("/translate")
async def translate_endpoint(
    file: UploadFile = File(...), 
    mode: str = Form(...),
    target_lang: str = Form("english")
):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_cv is None: return {"error": "Invalid Image"}
    
    debug_img = img_cv.copy()
    timestamp = int(time.time())
    
    is_photo = (mode == "Real Photo (Embossed)")
    thresh = clean_image(img_cv, is_photo)
    dots = detect_dots(thresh)
    
    if not dots:
        return {"raw": "No dots found", "ai": "No dots found", "translated": "No dots found", "image": None}

    lines = group_dots_into_lines(dots)
    
    # --- STRICT GRID ALIGNMENT ---
    # Calculate horizontal (X) and vertical (Y) dot spacing separately
    avg_dot_w = np.median([d[2] for d in dots])
    dx_list, dy_list = [], []
    
    for line in lines:
        xs = sorted([d[4] for d in line])
        for i in range(1, len(xs)):
            dx = xs[i] - xs[i-1]
            if dx > avg_dot_w * 0.3: # Ignore dots in exact same column
                dx_list.append(dx)
                
        ys = sorted([d[5] for d in line])
        for i in range(1, len(ys)):
            dy = ys[i] - ys[i-1]
            if dy > avg_dot_w * 0.3: # Ignore dots in exact same row
                dy_list.append(dy)

    # 25th percentile mathematically isolates the intra-cell distance perfectly
    raw_Sx = np.percentile(dx_list, 25) if dx_list else avg_dot_w * 2.5
    raw_Sy = np.percentile(dy_list, 25) if dy_list else avg_dot_w * 2.5
    
    # Bound the values to physical Braille limits to prevent glitching on weird images
    S_x = max(min(raw_Sx, avg_dot_w * 3.5), avg_dot_w * 1.2)
    S_y = max(min(raw_Sy, avg_dot_w * 3.5), avg_dot_w * 1.2)

    final_text = ""
    for line in lines:
        line.sort(key=lambda d: d[4])
        line_top_cy = min(d[5] for d in line) 
        
        cluster = [line[0]]
        cell_min_cx = line[0][4]
        
        for dot in line[1:]:
            cx = dot[4]
            prev_cx = cluster[-1][4]
            
            # THE STRICT WIDTH RULE:
            # A Braille cell has 2 columns. The distance from col 1 to col 2 is S_x.
            # If a dot is more than 1.4 * S_x away from the FIRST dot of this cell, 
            # it is physically impossible for it to belong to this cell. Split it!
            if (cx - cell_min_cx) > S_x * 1.4:
                
                # Decode completed character
                char, rect = translator.decode_cell(cluster, S_x, S_y, line_top_cy)
                final_text += char
                cv2.rectangle(debug_img, (rect[0], rect[1]), (rect[2], rect[3]), (0, 255, 0), 2)
                
                # Check for Space (Distance from end of last char to start of new char)
                if (cx - prev_cx) > S_x * 2.5:
                    final_text += " "
                    
                # Start new cell
                cluster = [dot]
                cell_min_cx = cx
            else:
                cluster.append(dot)
                
        # Process final character
        if cluster:
            char, rect = translator.decode_cell(cluster, S_x, S_y, line_top_cy)
            final_text += char
            cv2.rectangle(debug_img, (rect[0], rect[1]), (rect[2], rect[3]), (0, 255, 0), 2)
        
        final_text += "\n"

    raw_output = final_text.strip()
    ai_output = refiner.fix_text(raw_output)
    translated_output = refiner.translate_text(ai_output, target_lang=target_lang)

    _, buffer = cv2.imencode('.jpg', debug_img)
    img_base64 = base64.b64encode(buffer).decode('utf-8')

    return {
        "raw": raw_output,
        "ai": ai_output,
        "translated": translated_output,
        "image": f"data:image/jpeg;base64,{img_base64}"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)