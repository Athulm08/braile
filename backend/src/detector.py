#braile/backend/src/detector.py

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
            # Same robust noise filter as your “accurate” code
            if area > 3 and (0.15 * median_area < area < 5.0 * median_area):
                dots.append(cv2.boundingRect(c))
    return dots


def group_dots_into_lines(dots):
    if not dots:
        return []

    # Sort by y (top to bottom)
    dots.sort(key=lambda k: k[1])

    lines = []
    curr_line = [dots[0]]
    avg_h = sum(d[3] for d in dots) / len(dots)

    for i in range(1, len(dots)):
        # Relaxed vertical check (2.0 * height) same as UltimateScanner
        if abs(dots[i][1] - curr_line[-1][1]) < (avg_h * 2.0):
            curr_line.append(dots[i])
        else:
            lines.append(curr_line)
            curr_line = [dots[i]]

    lines.append(curr_line)
    return lines
