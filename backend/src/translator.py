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
            '011010': '!', '001000': "'", '000001': '^',
            '011000': ';', '010010': ':', '010001': '_', '011011': '=',
            '001010': '*', '001011': '"'
        }

    def decode_cell(self, cluster, cell_anchor_x, S_x, S_y, line_top_cy):
        if not cluster: return "?", (0, 0, 0, 0)
        code = ['0'] * 6
        for d in cluster:
            cx, cy = d[4], d[5]
            col = 1 if (cx - cell_anchor_x) > (S_x * 0.5) else 0
            dy = cy - line_top_cy
            if dy < S_y * 0.5: row = 0
            elif dy < S_y * 1.5: row = 1
            else: row = 2
            idx = (3 + row) if col == 1 else row
            if 0 <= idx < 6: code[idx] = '1'

        char = self.braille_map.get("".join(code), '?')
        box_x1 = int(cell_anchor_x - S_x * 0.4)
        box_y1 = int(line_top_cy - S_y * 0.5)
        box_x2 = int(cell_anchor_x + S_x * 1.4)
        box_y2 = int(line_top_cy + S_y * 2.5)
        return char, (box_x1, box_y1, box_x2, box_y2)

    def post_process_text(self, text):
        num_map = {
            'a': '1', 'b': '2', 'c': '3', 'd': '4', 'e': '5',
            'f': '6', 'g': '7', 'h': '8', 'i': '9', 'j': '0',
            ',': '1', ';': '2', ':': '3', '.': '4', '_': '5',
            '!': '6', '=': '7', '?': '8', '*': '9', '"': '0'
        }
        result =[]
        is_number_mode = False
        for char in text:
            if char == '#':
                is_number_mode = True
                continue
            if char == ' ' or char == '\n':
                is_number_mode = False
                result.append(char)
            elif is_number_mode:
                if char in num_map:
                    result.append(num_map[char])
                else:
                    is_number_mode = False
                    result.append(char)
            else:
                result.append(char)
        return "".join(result)

    def text_to_braille(self, text):
        eng_to_braille = {
            'a': '⠁', 'b': '⠃', 'c': '⠉', 'd': '⠙', 'e': '⠑',
            'f': '⠋', 'g': '⠛', 'h': '⠓', 'i': '⠊', 'j': '⠚',
            'k': '⠅', 'l': '⠇', 'm': '⠍', 'n': '⠝', 'o': '⠕',
            'p': '⠏', 'q': '⠟', 'r': '⠗', 's': '⠎', 't': '⠞',
            'u': '⠥', 'v': '⠧', 'w': '⠺', 'x': '⠭', 'y': '⠽',
            'z': '⠵', ' ': '⠀', '\n': '\n',
            ',': '⠂', ';': '⠆', ':': '⠒', '.': '⠲', '!': '⠖',
            '?': '⠦', "'": '⠄', '-': '⠤', '#': '⠼'
        }
        num_map = {'1':'a', '2':'b', '3':'c', '4':'d', '5':'e', '6':'f', '7':'g', '8':'h', '9':'i', '0':'j'}
        result = ""
        is_number_mode = False
        for char in text.lower():
            if char.isdigit():
                if not is_number_mode:
                    result += eng_to_braille['#']
                    is_number_mode = True
                result += eng_to_braille[num_map[char]]
            else:
                if char == ' ' or char == '\n':
                    is_number_mode = False
                result += eng_to_braille.get(char, char)
        return result

    def braille_to_text(self, braille_str):
        """Converts Unicode Braille Characters back into Raw English Text"""
        braille_to_eng = {
            '⠁': 'a', '⠃': 'b', '⠉': 'c', '⠙': 'd', '⠑': 'e',
            '⠋': 'f', '⠛': 'g', '⠓': 'h', '⠊': 'i', '⠚': 'j',
            '⠅': 'k', '⠇': 'l', '⠍': 'm', '⠝': 'n', '⠕': 'o',
            '⠏': 'p', '⠟': 'q', '⠗': 'r', '⠎': 's', '⠞': 't',
            '⠥': 'u', '⠧': 'v', '⠺': 'w', '⠭': 'x', '⠽': 'y',
            '⠵': 'z', '⠀': ' ', '\n': '\n',
            '⠂': ',', '⠆': ';', '⠒': ':', '⠲': '.', '⠖': '!',
            '⠦': '?', '⠄': "'", '⠤': '-', '⠼': '#'
        }
        raw_text = ""
        for char in braille_str:
            raw_text += braille_to_eng.get(char, char)
        return raw_text