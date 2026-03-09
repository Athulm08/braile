import os

# 1. Configuration
# Changed to '.' to scan the entire current folder (includes backend and frontend)
SOURCE_DIR = '.' 
OUTPUT_FILE = 'extracted_project_code.txt'

# Folders we DO NOT want to extract (Frontend & Backend massive folders)
IGNORE_DIRS = {
    'node_modules', 
    '.git', 
    'build', 
    'dist', 
    '.next',
    'venv',         # Ignored if backend uses Python virtual env
    'env',          # Ignored if backend uses Python virtual env
    '__pycache__'   # Ignored if backend uses Python
}

# Only extract files with these extensions
ALLOWED_EXTENSIONS = {
    '.js', '.jsx', '.cjs', '.mjs',
    '.ts', '.tsx', 
    '.css', '.scss', 
    '.html', 
    '.json',
    '.py',          # Added in case backend is Python
    '.md'           # Added to grab README.md
}

# Specific files to ignore (like large lock files)
IGNORE_FILES = {
    'package-lock.json', 
    'yarn.lock',
    'extract.py'    # Let's ignore this script itself so it doesn't print
}

def extract_code():
    print(f"Starting extraction from '{os.path.abspath(SOURCE_DIR)}'...")
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        # os.walk goes through the folder structure
        for root, dirs, files in os.walk(SOURCE_DIR):
            
            # Remove ignored directories from the search list IN-PLACE.
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            
            for file in files:
                if file in IGNORE_FILES:
                    continue
                
                # Check file extension
                _, ext = os.path.splitext(file)
                if ext.lower() in ALLOWED_EXTENSIONS:
                    filepath = os.path.join(root, file)
                    
                    # Create a clean relative path (e.g., "backend\src\server.js")
                    rel_path = os.path.relpath(filepath, start='.')
                    
                    # Write the folder structure/file path as a header
                    outfile.write(f"\n{'='*60}\n")
                    outfile.write(f"FILE PATH: {rel_path}\n")
                    outfile.write(f"{'='*60}\n\n")
                    
                    # Read the file content and write it to the txt file
                    try:
                        with open(filepath, 'r', encoding='utf-8') as infile:
                            content = infile.read()
                            outfile.write(content)
                            outfile.write("\n\n")
                    except Exception as e:
                        outfile.write(f"// ERROR READING FILE: {e}\n\n")

    print(f"Extraction complete! Code has been saved to '{OUTPUT_FILE}'.")

if __name__ == "__main__":
    extract_code()
