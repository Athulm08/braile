# braile/backend/src/app.py

import os
import time
import cv2
import numpy as np
import gradio as gr
from PIL import Image

from preprocess import clean_image
from detector import detect_dots, group_dots_into_lines
from translator import BrailleTranslator
from ai_refiner import AIRefiner

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
    else:
        S_x = S_y

    S_x = max(S_x, avg_dot_w * 1.2)
    S_y = max(S_y, avg_dot_w * 1.2)

    final_text = ""
    for line in lines:
        if not line: continue
        line.sort(key=lambda d: d[4])
        line_top_cy = min(d[5] for d in line) 
        
        clusters = []
        curr_cluster = [line[0]]
        for dot in line[1:]:
            if (dot[4] - curr_cluster[-1][4]) > S_x * 1.4:
                clusters.append(curr_cluster)
                curr_cluster = [dot]
            else:
                curr_cluster.append(dot)
        if curr_cluster:
            clusters.append(curr_cluster)
            
        strides =[]
        for i in range(1, len(clusters)):
            d_cx = clusters[i][0][4] - clusters[i-1][-1][4]
            if S_x * 1.0 < d_cx < S_x * 3.5:
                strides.append(clusters[i][0][4] - clusters[i-1][0][4])
        Cell_Stride = np.median(strides) if strides else S_x * 2.6
        
        expected_anchor_x = clusters[0][0][4]
        
        if len(clusters[0]) > 0:
            first_w = max(d[4] for d in clusters[0]) - min(d[4] for d in clusters[0])
            if first_w < S_x * 0.5 and len(clusters) > 1:
                dist_to_next = clusters[1][0][4] - clusters[0][0][4]
                if dist_to_next < Cell_Stride * 0.8:
                    expected_anchor_x = clusters[0][0][4] - S_x
                    
        line_text = ""
        for cluster in clusters:
            min_cx = min(d[4] for d in cluster)
            shift = min_cx - expected_anchor_x
            num_strides = max(0, round(shift / Cell_Stride))
            current_cell_anchor_x = expected_anchor_x + num_strides * Cell_Stride
            
            if abs(min_cx - (current_cell_anchor_x + S_x)) < abs(min_cx - current_cell_anchor_x):
                actual_cell_anchor_x = min_cx - S_x
            else:
                actual_cell_anchor_x = min_cx
                
            char, rect = translator.decode_cell(cluster, actual_cell_anchor_x, S_x, S_y, line_top_cy)
            
            if num_strides > 1 and len(line_text) > 0:
                line_text += " " * (num_strides - 1)
                
            line_text += char
            cv2.rectangle(debug_img, (rect[0], rect[1]), (rect[2], rect[3]), (0, 255, 0), 2)
            
            expected_anchor_x = actual_cell_anchor_x
            
        final_text += line_text + "\n"

    cv2.imwrite(output_path, debug_img)
    
    raw_output = final_text.strip()
    raw_output = translator.post_process_text(raw_output)
    ai_output = refiner.fix_text(raw_output)
    
    return raw_output, ai_output, cv2.cvtColor(debug_img, cv2.COLOR_BGR2RGB)

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

if __name__ == "__main__":
    demo.launch(share=True, debug=True)