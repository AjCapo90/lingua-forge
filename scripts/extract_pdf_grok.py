#!/usr/bin/env python3
"""
Extract structured content from PDF textbooks using Grok Vision (xAI)
"""

import sys
import json
import base64
import fitz  # PyMuPDF
import requests
from pathlib import Path

import os
XAI_API_KEY = os.environ.get("XAI_API_KEY", "")

EXTRACTION_PROMPT = """Analyze this textbook page about English phrasal verbs.

Extract ALL phrasal verbs, vocabulary items, and content found on this page into structured JSON.

For each phrasal verb found, extract:
- phrasal_verb: the phrasal verb (e.g., "pick up", "get by")
- definition: what it means
- examples: array of example sentences from the book
- register: formal/informal/neutral if mentioned
- notes: any special notes about usage

Return ONLY valid JSON in this format:
{
  "page_type": "content|exercises|mixed",
  "phrasal_verbs": [...],
  "other_content": "any other relevant content as text"
}

Be thorough - extract EVERYTHING from the page."""


def pdf_to_images(pdf_path: str) -> list:
    """Convert PDF pages to base64-encoded images"""
    doc = fitz.open(pdf_path)
    images = []
    
    for page_num in range(len(doc)):
        page = doc[page_num]
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


def extract_with_grok(image_base64: str, page_num: int) -> dict:
    """Send image to Grok Vision for extraction"""
    print(f"Processing page {page_num} with Grok Vision...", file=sys.stderr)
    
    response = requests.post(
        "https://api.x.ai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {XAI_API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": "grok-2-vision-1212",  # Grok vision model
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
        print("Usage: python extract_pdf_grok.py <pdf_path> [output_path]", file=sys.stderr)
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else "extracted_content_grok.json"
    
    print(f"Processing: {pdf_path}", file=sys.stderr)
    
    # Convert PDF to images
    images = pdf_to_images(pdf_path)
    print(f"Converted {len(images)} pages to images", file=sys.stderr)
    
    # Process each page with Grok Vision
    all_content = {
        "source_file": str(pdf_path),
        "total_pages": len(images),
        "extraction_model": "grok-2-vision-1212",
        "pages": []
    }
    
    all_phrasal_verbs = []
    
    for img in images:
        result = extract_with_grok(img["base64"], img["page"])
        result["page_number"] = img["page"]
        all_content["pages"].append(result)
        
        # Aggregate phrasal verbs
        if "phrasal_verbs" in result:
            for pv in result["phrasal_verbs"]:
                pv["source_page"] = img["page"]
                all_phrasal_verbs.append(pv)
        
        print(f"Page {img['page']} done", file=sys.stderr)
    
    # Add aggregated data
    all_content["all_phrasal_verbs"] = all_phrasal_verbs
    all_content["summary"] = {
        "total_phrasal_verbs": len(all_phrasal_verbs)
    }
    
    # Save to file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(all_content, f, indent=2, ensure_ascii=False)
    
    print(f"\nExtraction complete! Saved to: {output_path}", file=sys.stderr)
    print(f"Found {len(all_phrasal_verbs)} phrasal verbs", file=sys.stderr)
    
    # Also print to stdout
    print(json.dumps(all_content, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
