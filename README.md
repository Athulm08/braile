# Braille Script to Normal Language Using AI & Deep Learning

This project converts Braille script images into normal readable text using Computer Vision and Deep Learning techniques.

## Features
- Braille image preprocessing using OpenCV
- Dot detection and Braille cell grouping
- Rule-based Braille character translation
- AI-based text refinement using T5 Transformer model
- FastAPI backend
- React + Tailwind frontend

## Model Used
- **T5-small Transformer model** (HuggingFace)
- Used for correcting spelling and improving grammar

## Dataset
- No custom dataset used for Braille recognition
- Braille decoding is done using standard Braille encoding rules
- AI model is pre-trained on the **C4 (Colossal Clean Crawled Corpus)** dataset

## Technology Stack
- Python, OpenCV, NumPy
- PyTorch, HuggingFace Transformers
- FastAPI
- React, Tailwind CSS

## Workflow

Braille Image → Preprocessing → Dot Detection → Braille Decoding → Raw Text → AI Refinement → Final Text



## Author
Athul M  
MCA – Braille Script to Normal Language Using AI & Deep Learning  



structure of the code

braile-main/
│
├── README.md
│
├── backend/
│   │
│   ├── requirements.txt
│   │
│   ├── data/
│   │   └── (optional: sample images / test images)
│   │
│   └── src/
│       │
│       ├── main.py
│       ├── preprocess.py
│       ├── detector.py
│       ├── translator.py
│       └── ai_refiner.py
│
└── frontend/
    │
    ├── package.json
    ├── vite.config.js
    ├── index.html
    │
    └── src/
        │
        ├── main.jsx
        ├── App.jsx
        ├── App.css
        └── index.css
