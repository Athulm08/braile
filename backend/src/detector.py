# braile/backend/src/detector.py

import cv2
import numpy as np

def detect_dots(thresh_img):
    contours, _ = cv2.findContours(
        thresh_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    dots =[]
    valid_contours =[]
    
    # 1. Filter out extreme noise and the massive black bar on the left
    for c in contours:
        x, y, w, h = cv2.boundingRect(c)
        area = cv2.contourArea(c)
        aspect_ratio = float(w) / max(h, 1)
        # 5 to 15000 easily covers dots while rejecting huge bars
        if 5 < area < 15000 and 0.3 < aspect_ratio < 3.0:
            valid_contours.append((area, x, y, w, h))
            
    if not valid_contours:
        return dots
        
    # 2. Use 98th Percentile to find the size of the TRUE filled dots
    areas = [v[0] for v in valid_contours]
    target_area = np.percentile(areas, 98)
    
    for area, x, y, w, h in valid_contours:
        # 3. Reject Placeholder Dots: Only keep dots > 40% of the true dot size
        if 0.4 * target_area < area < 2.5 * target_area:
            cx = x + (w / 2.0)
            cy = y + (h / 2.0)
            dots.append((x, y, w, h, cx, cy))
            
    return dots

def group_dots_into_lines(dots):
    if not dots:
        return[]

    dots.sort(key=lambda k: k[5])
    lines = []
    curr_line = [dots[0]]
    
    avg_h = np.median([d[3] for d in dots])

    for i in range(1, len(dots)):
        if abs(dots[i][5] - curr_line[-1][5]) < (avg_h * 1.8):
            curr_line.append(dots[i])
        else:
            lines.append(curr_line)
            curr_line =[dots[i]]

    lines.append(curr_line)
    return lines