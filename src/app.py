import os
import time
import cv2
import numpy as np
import gradio as gr
from PIL import Image

# Import the modules we just created
from preprocess import clean_image
from detector import detect_dots, group_dots_into_lines
from translator import BrailleTranslator
from ai_refiner import AIRefiner

# Folder Setup
DATA_INPUT_DIR = "data/input"
DATA_OUTPUT_DIR = "data/output"
for folder in [DATA_INPUT_DIR, DATA_OUTPUT_DIR]:
    os.makedirs(folder, exist_ok=True)

translator = BrailleTranslator()
refiner = AIRefiner()

def process_workflow(image, mode):
    if image is None: return "", "", None
    
    timestamp = int(time.time())
    input_path = os.path.join(DATA_INPUT_DIR, f"scan_{timestamp}.jpg")
    output_path = os.path.join(DATA_OUTPUT_DIR, f"result_{timestamp}.jpg")

    image.save(input_path)
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
        gap_limit = avg_dot_w * 3.5 # Optimized gap threshold
        
        cluster = []
        last_x = line[0][0]
        for dot in line:
            # If gap is too large, process the current character and reset
            if (dot[0] - last_x) > gap_limit:
                char, rect = translator.decode_cell(cluster, avg_dot_w)
                final_text += char
                cv2.rectangle(debug_img, (rect[0], rect[1]), (rect[2], rect[3]), (0, 255, 0), 2)
                cluster = []
            
            cluster.append(dot)
            last_x = dot[0]
        
        # Process the final character of the line
        if cluster:
            char, rect = translator.decode_cell(cluster, avg_dot_w)
            final_text += char
            cv2.rectangle(debug_img, (rect[0], rect[1]), (rect[2], rect[3]), (0, 255, 0), 2)
        final_text += "\n"

    cv2.imwrite(output_path, debug_img)
    raw_output = final_text.strip()
    ai_output = refiner.fix_text(raw_output)
    
    return raw_output, ai_output, cv2.cvtColor(debug_img, cv2.COLOR_BGR2RGB)

# Gradio Interface
with gr.Blocks(theme=gr.themes.Soft()) as demo:
    gr.Markdown("# 🧠 Intelligent Braille-to-Text Workflow")
    gr.Markdown("This system saves every scan for your dataset and uses LLMs to refine the results.")
    
    with gr.Row():
        with gr.Column():
            input_img = gr.Image(type="pil", label="Upload Braille Script")
            mode = gr.Radio(["Digital/Black Dots", "Real Photo (Embossed)"], 
                            label="Scan Mode", value="Digital/Black Dots")
            btn = gr.Button("Process Script", variant="primary")
            
        with gr.Column():
            debug_out = gr.Image(label="AI Dot Segmentation")
            raw_out = gr.Textbox(label="Raw Detection")
            ai_out = gr.Textbox(label="AI Refined Text")

    btn.click(process_workflow, inputs=[input_img, mode], outputs=[raw_out, ai_out, debug_out])

demo.launch(share=True, debug=True)