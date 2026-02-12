import os
import time
import cv2
import numpy as np
import base64
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

# Import your custom modules
from preprocess import clean_image
from detector import detect_dots, group_dots_into_lines
from translator import BrailleTranslator
from ai_refiner import AIRefiner

app = FastAPI()

# --- CORS SETUP ---
# Allows your React Frontend (usually port 5173) to communicate with this Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Folder Setup for Dataset Collection
DATA_INPUT_DIR = "data/input"
DATA_OUTPUT_DIR = "data/output"
for folder in [DATA_INPUT_DIR, DATA_OUTPUT_DIR]:
    os.makedirs(folder, exist_ok=True)

# Initialize global classes
translator = BrailleTranslator()
refiner = AIRefiner()

@app.post("/translate")
async def translate_endpoint(
    file: UploadFile = File(...), 
    mode: str = Form(...),
    target_lang: str = Form("english")
):
    # 1. Load Image from Request
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img_cv = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_cv is None:
        return {"error": "Invalid Image"}
    
    debug_img = img_cv.copy()
    
    # 2. Save original for dataset (Internal tracking)
    timestamp = int(time.time())
    cv2.imwrite(os.path.join(DATA_INPUT_DIR, f"scan_{timestamp}.jpg"), img_cv)

    # 3. Preprocessing (Adaptive Thresholding)
    is_photo = (mode == "Real Photo (Embossed)")
    thresh = clean_image(img_cv, is_photo)
    
    # 4. Dot Detection
    dots = detect_dots(thresh)
    
    if not dots:
        return {
            "raw": "No dots found", 
            "ai": "No dots found", 
            "translated": "No dots found", 
            "image": None
        }

    # 5. Grouping and Decoding Logic
    lines = group_dots_into_lines(dots)
    avg_dot_w = sum(d[2] for d in dots) / len(dots)
    
    final_text = ""
    for line in lines:
        line.sort(key=lambda k: k[0]) # Sort dots left-to-right
        gap_limit = avg_dot_w * 3.5 
        cluster, last_x = [], line[0][0]
        
        for dot in line:
            # Check for character spacing
            if (dot[0] - last_x) > gap_limit:
                char, rect = translator.decode_cell(cluster, avg_dot_w)
                final_text += char
                # Draw boxes for visual feedback
                cv2.rectangle(debug_img, (rect[0], rect[1]), (rect[2], rect[3]), (0, 255, 0), 2)
                cluster = []
            
            cluster.append(dot)
            last_x = dot[0]
            
        # Decode the last character of the line
        if cluster:
            char, rect = translator.decode_cell(cluster, avg_dot_w)
            final_text += char
            cv2.rectangle(debug_img, (rect[0], rect[1]), (rect[2], rect[3]), (0, 255, 0), 2)
        
        final_text += " " # Space between lines

    # 6. Save processed result (Visual feedback)
    cv2.imwrite(os.path.join(DATA_OUTPUT_DIR, f"result_{timestamp}.jpg"), debug_img)
    
    # 7. AI Refinement (Cleaning the English text)
    raw_output = final_text.strip()
    ai_output = refiner.fix_text(raw_output)
    
    # 8. Final Multi-Language Translation (Google Translate Integration)
    # This calls your ai_refiner.py method that uses 'mtranslate'
    translated_output = refiner.translate_text(ai_output, target_lang=target_lang)

    # 9. Convert OpenCV image to Base64 String for the React Frontend
    _, buffer = cv2.imencode('.jpg', debug_img)
    img_base64 = base64.b64encode(buffer).decode('utf-8')

    return {
        "raw": raw_output,
        "ai": ai_output,              # Displays in "Refined English" box
        "translated": translated_output, # Displays in "Final Translation" box
        "image": f"data:image/jpeg;base64,{img_base64}"
    }

if __name__ == "__main__":
    import uvicorn
    # Start the server on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)