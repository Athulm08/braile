#braile/backend/src/d/translator.py

class BrailleTranslator:
    def __init__(self):
        self.braille_map = {
            '100000': 'a', '110000': 'b', '100100': 'c', '100110': 'd', '100010': 'e',
            '110100': 'f', '110110': 'g', '110010': 'h', '010100': 'i', '010110': 'j',
            '101000': 'k', '111000': 'l', '101100': 'm', '101110': 'n', '101010': 'o',
            '111100': 'p', '111110': 'q', '111010': 'r', '011100': 's', '011110': 't',
            '101001': 'u', '111001': 'v', '010111': 'w', '101101': 'x', '101111': 'y',
            '101011': 'z', '000000': ' ', '001111': '#'
        }

    def decode_cell(self, cluster, avg_dot_w):
        if not cluster: return "?", (0, 0, 0, 0)

        # 1. Get the boundaries of the character box
        min_x = min(d[0] for d in cluster)
        min_y = min(d[1] for d in cluster)
        max_x = max(d[0] + d[2] for d in cluster)
        max_y = max(d[1] + d[3] for d in cluster)

        cell_w = max_x - min_x
        cell_h = max_y - min_y

        code = ['0'] * 6
        for d in cluster:
            rel_x = d[0] - min_x
            rel_y = d[1] - min_y

            # Adaptive Column Detection
            if cell_w > avg_dot_w * 1.2:
                col = 1 if rel_x > (cell_w * 0.4) else 0
            else:
                col = 0 # Single column letter

            # Adaptive Row Detection (split cell height into 3 zones)
            if rel_y < (cell_h * 0.35):
                row = 0
            elif rel_y < (cell_h * 0.7):
                row = 1
            else:
                row = 2

            idx = (3 + row) if col == 1 else row
            if 0 <= idx < 6: code[idx] = '1'

        char = self.braille_map.get("".join(code), '?')
        return char, (min_x-2, min_y-2, max_x+2, max_y+2)