# braile/backend/src/translator.py

class BrailleTranslator:
    def __init__(self):
        self.braille_map = {
            '100000': 'a', '110000': 'b', '100100': 'c', '100110': 'd', '100010': 'e',
            '110100': 'f', '110110': 'g', '110010': 'h', '010100': 'i', '010110': 'j',
            '101000': 'k', '111000': 'l', '101100': 'm', '101110': 'n', '101010': 'o',
            '111100': 'p', '111110': 'q', '111010': 'r', '011100': 's', '011110': 't',
            '101001': 'u', '111001': 'v', '010111': 'w', '101101': 'x', '101111': 'y',
            '101011': 'z', '000000': ' ', '001111': '#',
            '010000': ',', '010011': '.', '011001': '?', 
            '011010': '!', '001000': "'", '000001': '^'
        }

    def decode_cell(self, cluster, S_x, S_y, line_top_cy):
        if not cluster: return "?", (0, 0, 0, 0)

        # Baseline X coordinate for this specific character
        min_cx = min(d[4] for d in cluster)

        code = ['0'] * 6
        for d in cluster:
            cx, cy = d[4], d[5]
            
            # 1. COLUMN DETECTION (Using exact X Spacing)
            col = 1 if (cx - min_cx) > (S_x * 0.5) else 0

            # 2. ROW DETECTION (Using exact Y Spacing)
            dy = cy - line_top_cy
            
            if dy < S_y * 0.5:
                row = 0
            elif dy < S_y * 1.5:
                row = 1
            else:
                row = 2

            idx = (3 + row) if col == 1 else row
            if 0 <= idx < 6: 
                code[idx] = '1'

        char = self.braille_map.get("".join(code), '?')
        
        # UI Output: Draw a mathematically perfect 2x3 uniform grid box 
        # around the cell, rather than shrink-wrapping the dots.
        box_x1 = int(min_cx - S_x * 0.4)
        box_y1 = int(line_top_cy - S_y * 0.5)
        box_x2 = int(min_cx + S_x * 1.4)
        box_y2 = int(line_top_cy + S_y * 2.5)
        
        return char, (box_x1, box_y1, box_x2, box_y2)