#!/usr/bin/env python3
"""
Extract structured content from PDF textbooks using GPT-4 Vision
"""

import sys
import json
import base64
import fitz  # PyMuPDF
import requests
from pathlib import Path

import os
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

EXTRACTION_PROMPT = """Analyze this textbook page about English phrasal verbs.

Extract ALL phrasal verbs, vocabulary items, and exercises found on this page into structured JSON.

For each phrasal verb found, extract:
- phrasal_verb: the phrasal verb (e.g., "pick up", "get by")
- definition: what it means
- examples: array of example sentences from the book
- register: formal/informal/neutral if mentioned
- notes: any special notes about usage

For exercises, extract:
- exercise_number: the exercise number
- exercise_type: type of exercise (fill-in, matching, etc.)
- instructions: what the student should do
- items: array of exercise items/questions

Return ONLY valid JSON in this format:
{
  "page_type": "content|exercises|mixed",
  "phrasal_verbs": [...],
  "exercises": [...],
  "other_content": "any other relevant content as text"
}

Be thorough - extract EVERYTHING from the page."""


def pdf_to_images(pdf_path: str) -> list:
    """Convert PDF pages to base64-encoded images"""
    doc = fitz.open(pdf_path)
    images = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        # Render at 150 DPI for good quality
        pix = page.get_pixmap(matrix=fitz.Matrix(150/72, 150/72))
        img_bytes = pix.tobytes("png")
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')
        images.append({
            "page": page_num + 1,
            "base64": img_base64
        })
        print(f"Converted page {page_num + 1}/{len(doc)}", file=sys.stderr)
    
    doc.close()
    return images


def extract_with_gpt4v(image_base64: str, page_num: int) -> dict:
    """Send image to GPT-4 Vision for extraction"""
    print(f"Processing page {page_num} with GPT-4 Vision...", file=sys.stderr)
    
    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "gpt-4o",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": EXTRACTION_PROMPT},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_base64}",
                                "detail": "high"
                            }
                        }
                    ]
                }
            ],
            "max_tokens": 4096
        },
        timeout=120
    )
    
    if response.status_code != 200:
        print(f"Error on page {page_num}: {response.text}", file=sys.stderr)
        return {"error": response.text, "page": page_num}
    
    data = response.json()
    content = data["choices"][0]["message"]["content"]
    
    # Try to parse JSON from response
    try:
        # Find JSON in the response
        start = content.find('{')
        end = content.rfind('}') + 1
        if start != -1 and end > start:
            json_str = content[start:end]
            return json.loads(json_str)
    except json.JSONDecodeError:
        pass
    
    return {"raw_content": content, "page": page_num}


def main():
    if len(sys.argv) < 2:
        print("Usage: python extract_pdf.py <pdf_path> [output_path]", file=sys.stderr)
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "extracted_content.json"
    
    print(f"Processing: {pdf_path}", file=sys.stderr)
    
    # Convert PDF to images
    images = pdf_to_images(pdf_path)
    print(f"Converted {len(images)} pages to images", file=sys.stderr)
    
    # Process each page with GPT-4V
    all_content = {
        "source_file": str(pdf_path),
        "total_pages": len(images),
        "pages": []
    }
    
    all_phrasal_verbs = []
    all_exercises = []
    
    for img in images:
        result = extract_with_gpt4v(img["base64"], img["page"])
        result["page_number"] = img["page"]
        all_content["pages"].append(result)
        
        # Aggregate phrasal verbs and exercises
        if "phrasal_verbs" in result:
            for pv in result["phrasal_verbs"]:
                pv["source_page"] = img["page"]
                all_phrasal_verbs.append(pv)
        
        if "exercises" in result:
            for ex in result["exercises"]:
                ex["source_page"] = img["page"]
                all_exercises.append(ex)
        
        print(f"Page {img['page']} done", file=sys.stderr)
    
    # Add aggregated data
    all_content["all_phrasal_verbs"] = all_phrasal_verbs
    all_content["all_exercises"] = all_exercises
    all_content["summary"] = {
        "total_phrasal_verbs": len(all_phrasal_verbs),
        "total_exercises": len(all_exercises)
    }
    
    # Save to file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_content, f, indent=2, ensure_ascii=False)
    
    print(f"\nExtraction complete! Saved to: {output_path}", file=sys.stderr)
    print(f"Found {len(all_phrasal_verbs)} phrasal verbs and {len(all_exercises)} exercises", file=sys.stderr)
    
    # Also print to stdout for easy capture
    print(json.dumps(all_content, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
