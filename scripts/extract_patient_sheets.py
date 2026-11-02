import os
import sys
import json
import csv
import io
import re
import urllib.request
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_DIR = "/Users/Jan/Library/CloudStorage/GoogleDrive-say@sayclinic.sk/Môj disk/Klienti SAY"
DATA_FILE = "src/data/clinic_data.json"

CLINIC_EMAILS = {
    "mrazplastickachirurgia@gmail.com",
    "mrazplasticsurgery@gmail.com",
    "jan.mraz89@gmail.com",
    "say@sayclinic.sk",
    "mraz@sayclinic.sk",
    "info@sayclinic.sk"
}

def normalize_rc(raw):
    if not raw or raw in ("Importované z Drive", "---"):
        return None
    digits = re.sub(r"\D", "", raw)
    if len(digits) in (9, 10):
        return f"{digits[:6]}/{digits[6:]}"
    clean = raw.strip()
    return clean if len(clean) >= 6 and not is_label(clean) else None

def derive_dob(rc):
    if not rc:
        return None
    clean = re.sub(r"\D", "", rc)
    if len(clean) not in (9, 10):
        return None
    try:
        yy = int(clean[:2])
        mm = int(clean[2:4])
        dd = int(clean[4:6])
        if mm > 50: mm -= 50
        if mm > 20: mm -= 20
        year_prefix = 2000 if (len(clean) == 10 and yy < 54) else 1900
        if 1 <= mm <= 12 and 1 <= dd <= 31:
            return f"{dd:02d}.{mm:02d}.{year_prefix + yy}"
    except:
        pass
    return None

def normalize_tel(raw):
    if not raw or raw == "---":
        return None
    clean = re.sub(r"[^\d+]", "", raw)
    if clean.startswith("00421"):
        clean = "+421" + clean[5:]
    elif clean.startswith("09") and len(clean) == 10:
        clean = "+421" + clean[1:]
    elif clean.startswith("9") and len(clean) == 9:
        clean = "+421" + clean
    elif clean.startswith("4219") and len(clean) == 12:
        clean = "+421" + clean[3:]
    if clean.startswith("+421") and len(clean) == 13:
        num = clean[4:]
        return f"+421 {num[:3]} {num[3:6]} {num[6:]}"
    clean_strip = raw.strip()
    return clean_strip if len(clean) >= 7 and not is_label(clean_strip) else None

def normalize_insurance(raw):
    if not raw or raw in ("Drive Klient", "---"):
        return "Samoplatca"
    low = raw.lower().strip()
    if any(k in low for k in ("24", "dôver", "dover")):
        return "24 (Dôvera)"
    if any(k in low for k in ("25", "všzp", "vszp", "všeobecn")):
        return "25 (VšZP)"
    if any(k in low for k in ("27", "union")):
        return "27 (Union)"
    return "Samoplatca"

def is_label(text):
    if not text:
        return False
    low = text.lower().strip().rstrip(":")
    labels = {
        "meno", "meno a priezvisko", "pacient", "klient", "klientka",
        "rodné číslo", "rodne cislo", "rč", "rc", "r.č.",
        "telefón", "telefon", "telefónne číslo", "telefonne cislo", "tel", "tel.", "mobil", "kontakt",
        "email", "e-mail", "mail", "e-mailová adresa", "emailová adresa",
        "bydlisko", "adresa", "trvalý pobyt", "trvaly pobyt", "adresa trvalého pobytu",
        "dátum", "datum", "dátum narodenia", "datum narodenia", "narodený", "narodená", "dob",
        "poisťovňa", "poistovna", "zdravotná poisťovňa", "zp",
        "klinika", "klinika rudlová", "dl -clinic", "dl clinic", "druh zákroku", "zákrok", "položky", "cena", "popis"
    }
    return low in labels

def parse_csv_grid(grid):
    res = {}
    for r in range(len(grid)):
        row = grid[r]
        for c in range(len(row)):
            cell = str(row[c] or "").strip()
            if not cell:
                continue
            lower = cell.lower().rstrip(":")
            
            def get_next():
                if c + 1 < len(row) and str(row[c + 1] or "").strip():
                    cand = str(row[c + 1]).strip()
                    if not is_label(cand): return cand
                if r + 1 < len(grid) and c < len(grid[r + 1]) and str(grid[r + 1][c] or "").strip():
                    cand = str(grid[r + 1][c]).strip()
                    if not is_label(cand): return cand
                if ":" in cell:
                    parts = cell.split(":", 1)
                    if len(parts) > 1 and parts[1].strip() and not is_label(parts[1].strip()):
                        return parts[1].strip()
                return ""
            
            if not res.get("phone") and any(k == lower or lower.startswith(k) for k in ["telefón", "telefon", "tel.", "mobil", "telefónne číslo", "telefonne cislo"]):
                v = get_next()
                if v:
                    phone_norm = normalize_tel(v)
                    if phone_norm: res["phone"] = phone_norm
            if not res.get("email") and any(k == lower or lower.startswith(k) for k in ["e-mail", "email", "e-mailová adresa", "mail"]):
                v = get_next()
                if v and "@" in v and v.lower() not in CLINIC_EMAILS and not v.lower().endswith("@sayclinic.sk"):
                    res["email"] = v
            if not res.get("birthNumber") and any(k == lower or lower.startswith(k) for k in ["rodné číslo", "rodne cislo", "rč", "rc"]):
                v = get_next()
                if v:
                    norm = normalize_rc(v)
                    if norm:
                        res["birthNumber"] = norm
                        if not res.get("dob"):
                            res["dob"] = derive_dob(norm)
            if not res.get("dob") and any(k == lower or lower.startswith(k) for k in ["dátum narodenia", "datum narodenia"]):
                v = get_next()
                if v and any(ch.isdigit() for ch in v) and not is_label(v):
                    res["dob"] = v
            if not res.get("address") and any(k == lower or lower.startswith(k) for k in ["bydlisko", "adresa"]):
                v = get_next()
                if v and len(v) > 3 and not v.startswith("DL -") and "@" not in v and not is_label(v):
                    res["address"] = v
            if not res.get("insurance") and any(k == lower or lower.startswith(k) for k in ["poisťovňa", "poistovna", "zp"]):
                v = get_next()
                if v:
                    res["insurance"] = normalize_insurance(v)

    # Regex fallbacks if missed
    for r in range(len(grid)):
        for c in range(len(grid[r])):
            cell = str(grid[r][c] or "").strip()
            if not cell: continue
            if not res.get("email"):
                m = re.search(r"\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b", cell)
                if m and m.group(1).lower() not in CLINIC_EMAILS and not m.group(1).lower().endswith("@sayclinic.sk"):
                    res["email"] = m.group(1)
            if not res.get("phone"):
                m = re.search(r"(?:\+?421|00421|0)[\s\-\/]?(?:9\d{2}|[2-8]\d)[\s\-\/]?\d{3}[\s\-\/]?\d{3}", cell)
                if m:
                    res["phone"] = normalize_tel(m.group(0))
            if not res.get("birthNumber"):
                m = re.search(r"\b(\d{6})\s*[\/\-]?\s*(\d{3,4})\b", cell)
                if m:
                    norm = f"{m.group(1)}/{m.group(2)}"
                    res["birthNumber"] = norm
                    if not res.get("dob"):
                        res["dob"] = derive_dob(norm)

    return res

def process_folder(folder_name):
    p_path = os.path.join(BASE_DIR, folder_name)
    if not os.path.isdir(p_path):
        return folder_name, None
    
    try:
        files = os.listdir(p_path)
    except:
        return folder_name, None
        
    gsheets = [f for f in files if f.endswith(".gsheet")]
    if not gsheets:
        return folder_name, None
        
    # Sort gsheets: consultation first, then apps/surgeries, then general
    gs_to_try = sorted(gsheets, key=lambda x: (
        0 if "konzult" in x.lower() else (
            1 if "aplik" in x.lower() or "zákrok" in x.lower() or "vyšetrenie" in x.lower() else 2
        )
    ))

    for gs in gs_to_try:
        try:
            with open(os.path.join(p_path, gs), "r", encoding="utf-8") as f:
                meta = json.load(f)
                doc_id = meta.get("doc_id")
            if not doc_id:
                continue
            
            url = f"https://docs.google.com/spreadsheets/d/{doc_id}/export?format=csv"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=4) as resp:
                content = resp.read().decode("utf-8", errors="ignore")
                reader = csv.reader(io.StringIO(content))
                grid = list(reader)
                extracted = parse_csv_grid(grid)
                if extracted.get("birthNumber") or extracted.get("phone") or extracted.get("email") or extracted.get("address"):
                    return folder_name, extracted
        except:
            continue
            
    return folder_name, None

def norm_str(s):
    if not s: return ""
    return unicodedata.normalize("NFC", s).strip().lower()

def main():
    if not os.path.exists(DATA_FILE):
        print(f"File {DATA_FILE} does not exist.")
        return
        
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    patients = data.get("patients", [])
    p_map = {norm_str(p["name"]): p for p in patients}
    
    folders = [f for f in os.listdir(BASE_DIR) if not f.startswith(".")]
    print(f"Total folders to process: {len(folders)}")
    
    updated_count = 0
    with ThreadPoolExecutor(max_workers=25) as executor:
        futures = {executor.submit(process_folder, f): f for f in folders}
        for future in as_completed(futures):
            folder_name, extracted = future.result()
            if extracted:
                norm_name = norm_str(folder_name)
                target = p_map.get(norm_name)
                if not target:
                    # Try partial match
                    for k, v in p_map.items():
                        if k in norm_name or norm_name in k:
                            target = v
                            break
                if target:
                    did_update = False
                    for k in ["birthNumber", "dob", "phone", "email", "address", "insurance"]:
                        val = extracted.get(k)
                        if val and target.get(k) in ("Importované z Drive", "---", "Drive Klient", None):
                            target[k] = val
                            did_update = True
                    if did_update:
                        target["sheetStatus"] = "synced"
                        target["sheetCheckedAt"] = "2026-10-29T14:15:00Z"
                        updated_count += 1
                        if updated_count % 50 == 0:
                            print(f"Progress: {updated_count} patients extracted...")
                            
    print(f"\nFinal extracted and updated count: {updated_count} patients!")
    
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Successfully saved {DATA_FILE}!")

if __name__ == "__main__":
    main()
