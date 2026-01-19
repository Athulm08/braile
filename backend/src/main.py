import os
import time
import cv2
import numpy as np
import base64
import io
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

# Import your modules
from preprocess import clean_image
from detector import detect_dots, group_dots_into_lines
from translator import BrailleTranslator
from ai_refiner import AIRefiner

app = FastAPI()

# --- CORS SETUP: Allows React (port 5173) to talk to Python (port 8000) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Folder Setup
DATA_INPUT_DIR = "data/input"
DATA_OUTPUT_DIR = "data/output"
for folder in [DATA_INPUT_DIR, DATA_OUTPUT_DIR]:
    os.makedirs(folder, exist_ok=True)

translator = BrailleTranslator()
refiner = AIRefiner()

@app.post("/translate")
async def translate_endpoint(file: UploadFile = File(...), mode: str = Form(...)):
    # 1. Load Image from Request
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    debug_img = img_cv.copy()
    
    # 2. Save original for dataset
    timestamp = int(time.time())
    cv2.imwrite(os.path.join(DATA_INPUT_DIR, f"scan_{timestamp}.jpg"), img_cv)

    # 3. Processing Logic
    is_photo = (mode == "Real Photo (Embossed)")
    thresh = clean_image(img_cv, is_photo)
    dots = detect_dots(thresh)
    
    if not dots:
        return {"raw": "No dots found", "ai": "No dots found", "image": None}

    lines = group_dots_into_lines(dots)
    avg_dot_w = sum(d[2] for d in dots) / len(dots)
    
    final_text = ""
    for line in lines:
        line.sort(key=lambda k: k[0])
        gap_limit = avg_dot_w * 3.5 
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

    # 4. Save processed result
    cv2.imwrite(os.path.join(DATA_OUTPUT_DIR, f"result_{timestamp}.jpg"), debug_img)
    
    # 5. AI Refinement
    raw_output = final_text.strip()
    ai_output = refiner.fix_text(raw_output)

    # 6. Convert OpenCV image to Base64 String for React to display
    _, buffer = cv2.imencode('.jpg', debug_img)
    img_base64 = base64.b64encode(buffer).decode('utf-8')

    return {
        "raw": raw_output,
        "ai": ai_output,
        "image": f"data:image/jpeg;base64,{img_base64}"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)