# braile/backend/src/detector.py

import cv2
import numpy as np

def detect_dots(thresh_img):
    contours, _ = cv2.findContours(
        thresh_img, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    dots = []
    if contours:
        areas = [cv2.contourArea(c) for c in contours]
        median_area = np.median(areas) if areas else 0
        for c in contours:
            area = cv2.contourArea(c)
            # Filter noise
            if area > 3 and (0.15 * median_area < area < 5.0 * median_area):
                x, y, w, h = cv2.boundingRect(c)
                # Calculate True Centers for mathematical grid alignment
                cx = x + (w / 2.0)
                cy = y + (h / 2.0)
                # Return tuple with centers included
                dots.append((x, y, w, h, cx, cy)) 
    return dots

def group_dots_into_lines(dots):
    if not dots:
        return []

    # Sort strictly by center Y (cy)
    dots.sort(key=lambda k: k[5])

    lines = []
    curr_line = [dots[0]]
    
    # Use median height to avoid outlier distortion
    avg_h = np.median([d[3] for d in dots])

    for i in range(1, len(dots)):
        # If the vertical center difference is small, it's the same line
        if abs(dots[i][5] - curr_line[-1][5]) < (avg_h * 1.5):
            curr_line.append(dots[i])
        else:
            lines.append(curr_line)
            curr_line = [dots[i]]

    lines.append(curr_line)
    return lines