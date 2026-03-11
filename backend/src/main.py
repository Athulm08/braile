# braile/backend/src/main.py

import os
import time
import uvicorn
import cv2
import numpy as np
import base64
import io
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gtts import gTTS

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
for folder in[DATA_INPUT_DIR, DATA_OUTPUT_DIR]:
    os.makedirs(folder, exist_ok=True)

translator = BrailleTranslator()
refiner = AIRefiner()

class TextRequest(BaseModel):
    text: str

class BrailleTextRequest(BaseModel):
    braille_text: str
    target_lang: str = "english"

class AudioRequest(BaseModel):
    text: str
    lang: str

# --- NEW: Cloud Native TTS Generator ---
@app.post("/generate-audio")
async def generate_audio_endpoint(req: AudioRequest):
    try:
        # Fetches native voice from Google Cloud
        tts = gTTS(text=req.text, lang=req.lang)
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        audio_base64 = base64.b64encode(fp.read()).decode('utf-8')
        return {"audio": f"data:audio/mp3;base64,{audio_base64}"}
    except Exception as e:
        return {"error": str(e)}

@app.post("/generate-braille")
async def generate_braille_endpoint(req: TextRequest):
    braille_output = translator.text_to_braille(req.text)
    return {"braille": braille_output}

@app.post("/translate-braille-text")
async def translate_braille_text_endpoint(req: BrailleTextRequest):
    raw_output = translator.braille_to_text(req.braille_text)
    raw_output = translator.post_process_text(raw_output)
    ai_output = refiner.fix_text(raw_output)
    translated_output = refiner.translate_text(ai_output, target_lang=req.target_lang)
    
    return {
        "raw": raw_output,
        "ai": ai_output,
        "translated": translated_output
    }

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
    is_photo = (mode == "Real Photo (Embossed)")
    thresh = clean_image(img_cv, is_photo)
    dots = detect_dots(thresh)
    
    if not dots:
        return {"raw": "No dots found", "ai": "No dots found", "translated": "No dots found", "image": None}

    lines = group_dots_into_lines(dots)
    
    avg_dot_w = np.median([d[2] for d in dots])
    dx_list, dy_list = [],[]
    for line in lines:
        xs = sorted([d[4] for d in line])
        for i in range(1, len(xs)):
            dx = xs[i] - xs[i-1]
            if dx > avg_dot_w * 0.5: dx_list.append(dx)
        ys = sorted([d[5] for d in line])
        for i in range(1, len(ys)):
            dy = ys[i] - ys[i-1]
            if dy > avg_dot_w * 0.5: dy_list.append(dy)

    S_y = np.percentile(dy_list, 25) if dy_list else (np.percentile(dx_list, 10) if dx_list else avg_dot_w * 2.5)
    if dx_list:
        raw_Sx = np.percentile(dx_list, 10)
        S_x = min(raw_Sx, S_y * 1.3) if dy_list else raw_Sx
    else: S_x = S_y

    S_x = max(S_x, avg_dot_w * 1.2)
    S_y = max(S_y, avg_dot_w * 1.2)

    final_text = ""
    for line in lines:
        if not line: continue
        line.sort(key=lambda d: d[4])
        line_top_cy = min(d[5] for d in line) 
        
        clusters =[]
        curr_cluster = [line[0]]
        for dot in line[1:]:
            if (dot[4] - curr_cluster[-1][4]) > S_x * 1.4:
                clusters.append(curr_cluster)
                curr_cluster = [dot]
            else: curr_cluster.append(dot)
        if curr_cluster: clusters.append(curr_cluster)
            
        strides =[]
        for i in range(1, len(clusters)):
            d_cx = clusters[i][0][4] - clusters[i-1][-1][4]
            if S_x * 1.0 < d_cx < S_x * 3.5: strides.append(clusters[i][0][4] - clusters[i-1][0][4])
        Cell_Stride = np.median(strides) if strides else S_x * 2.6
        
        expected_anchor_x = clusters[0][0][4]
        if len(clusters[0]) > 0:
            first_w = max(d[4] for d in clusters[0]) - min(d[4] for d in clusters[0])
            if first_w < S_x * 0.5 and len(clusters) > 1:
                if (clusters[1][0][4] - clusters[0][0][4]) < Cell_Stride * 0.8:
                    expected_anchor_x = clusters[0][0][4] - S_x
                    
        line_text = ""
        for cluster in clusters:
            min_cx = min(d[4] for d in cluster)
            shift = min_cx - expected_anchor_x
            num_strides = max(0, round(shift / Cell_Stride))
            current_cell_anchor_x = expected_anchor_x + num_strides * Cell_Stride
            
            if abs(min_cx - (current_cell_anchor_x + S_x)) < abs(min_cx - current_cell_anchor_x):
                actual_cell_anchor_x = min_cx - S_x
            else: actual_cell_anchor_x = min_cx
                
            char, rect = translator.decode_cell(cluster, actual_cell_anchor_x, S_x, S_y, line_top_cy)
            if num_strides > 1 and len(line_text) > 0: line_text += " " * (num_strides - 1)
                
            line_text += char
            cv2.rectangle(debug_img, (rect[0], rect[1]), (rect[2], rect[3]), (0, 255, 0), 2)
            expected_anchor_x = actual_cell_anchor_x
            
        final_text += line_text + "\n"

    raw_output = final_text.strip()
    raw_output = translator.post_process_text(raw_output)
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