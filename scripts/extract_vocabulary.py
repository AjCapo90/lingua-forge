#!/usr/bin/env python3
"""
Extract vocabulary from English Vocabulary in Use index PDF
No AI needed - just text parsing!
"""

import re
import json
import fitz  # PyMuPDF
from pathlib import Path

# IPA symbols to detect phonetic transcriptions
IPA_PATTERN = re.compile(r'^[əɪʊæɒɔɛʌɑːiːuːeɪaɪɔɪaʊəʊɪəeəʊəˈˌθðʃʒŋ\s\-]+$')

def is_ipa_only(text):
    """Check if text is purely IPA symbols."""
    # Remove spaces and check
    cleaned = text.replace(' ', '').replace('-', '')
    if len(cleaned) < 2:
        return True
    # Count IPA vs regular chars
    ipa_chars = set('əɪʊæɒɔɛʌɑːiueoaˈˌθðʃʒŋ')
    ipa_count = sum(1 for c in cleaned if c in ipa_chars)
    return ipa_count > len(cleaned) * 0.6

def is_valid_term(text):
    """Check if text is a valid vocabulary term."""
    if len(text) < 2:
        return False
    if is_ipa_only(text):
        return False
    # Should contain at least some regular letters
    if not re.search(r'[a-zA-Z]{2,}', text):
        return False
    # Skip things that look like partial numbers or fragments
    if re.match(r'^\d+,?\s*\d*,?$', text):
        return False
    return True

def extract_vocabulary(pdf_path: str, output_path: str):
    """Extract vocabulary items from the index PDF."""
    
    pdf = fitz.open(pdf_path)
    all_text = ""
    
    for page in pdf:
        all_text += page.get_text() + "\n"
    
    # Split into lines and clean
    lines = [l.strip() for l in all_text.split('\n') if l.strip()]
    
    # Skip header - find first entry
    start_idx = 0
    for i, line in enumerate(lines):
        if line == "a bit [slightly]":
            start_idx = i
            break
    
    lines = lines[start_idx:]
    
    vocabulary = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Skip page footers
        if "English Vocabulary in Use" in line:
            i += 1
            continue
        
        # Skip standalone numbers > 100 (page numbers)
        if re.match(r'^\d+$', line):
            num = int(line)
            if num > 100:
                i += 1
                continue
        
        # Check if this is a valid term (not IPA, not just numbers)
        if is_valid_term(line):
            entry = {
                "term": line,
                "ipa": "",
                "units": [],
                "priority": 3
            }
            
            # Look ahead for IPA and unit numbers
            j = i + 1
            ipa_parts = []
            
            while j < len(lines):
                next_line = lines[j]
                
                # Skip page footers
                if "English Vocabulary in Use" in next_line:
                    j += 1
                    continue
                
                # Is it unit number(s)? (1-100 range, possibly comma-separated)
                unit_match = re.match(r'^(\d{1,3}(?:,\s*\d{1,3})*)$', next_line)
                if unit_match:
                    units_str = unit_match.group(1)
                    parsed_units = [int(u.strip()) for u in units_str.split(',') if u.strip()]
                    # Valid units are 1-100
                    if all(1 <= u <= 100 for u in parsed_units):
                        entry["units"] = parsed_units
                        j += 1
                        break
                
                # Is it IPA?
                if is_ipa_only(next_line) or re.search(r'[əɪʊæɒɔɛʌɑːˈˌθðʃʒŋ]', next_line):
                    # Only add if it looks like IPA
                    if not is_valid_term(next_line):
                        ipa_parts.append(next_line)
                        j += 1
                        continue
                
                # Must be next entry
                break
            
            entry["ipa"] = ' '.join(ipa_parts).strip()
            
            # Calculate priority based on unit numbers
            if entry["units"]:
                min_unit = min(entry["units"])
                if min_unit <= 30:
                    entry["priority"] = 1  # Essential
                elif min_unit <= 60:
                    entry["priority"] = 2  # Common
                else:
                    entry["priority"] = 3  # Advanced
            
            # Clean up the term
            entry["term"] = re.sub(r'\s+', ' ', entry["term"]).strip()
            
            # Final validation
            if is_valid_term(entry["term"]) and entry["units"]:
                vocabulary.append(entry)
            
            i = j
        else:
            i += 1
    
    # Remove duplicates, keep first occurrence
    seen = set()
    unique_vocab = []
    for v in vocabulary:
        term_lower = v["term"].lower()
        if term_lower not in seen:
            seen.add(term_lower)
            unique_vocab.append(v)
    
    # Sort by priority, then alphabetically
    unique_vocab.sort(key=lambda x: (x["priority"], x["term"].lower()))
    
    # Stats
    priority_counts = {1: 0, 2: 0, 3: 0}
    for v in unique_vocab:
        priority_counts[v["priority"]] += 1
    
    output = {
        "source": "English Vocabulary in Use Pre-intermediate and Intermediate",
        "total": len(unique_vocab),
        "by_priority": priority_counts,
        "vocabulary": unique_vocab
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Estratti {len(unique_vocab)} vocaboli")
    print(f"   Priority 1 (essential, units 1-30): {priority_counts[1]}")
    print(f"   Priority 2 (common, units 31-60): {priority_counts[2]}")
    print(f"   Priority 3 (advanced, units 61-100): {priority_counts[3]}")
    
    return output

if __name__ == "__main__":
    import sys
    pdf_path = sys.argv[1] if len(sys.argv) > 1 else "/Users/alessandrobot/.openclaw/media/inbound/file_42---b42d564b-c612-4127-8f5c-20c458fa59b1.pdf"
    output_path = sys.argv[2] if len(sys.argv) > 2 else "vocabulary_extracted.json"
    
    extract_vocabulary(pdf_path, output_path)
