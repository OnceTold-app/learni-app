#!/usr/bin/env python3
"""
Fix question bank topic IDs to match what the app actually sends.
Also generates missing questions for times tables and division.
"""

import json
import requests
import uuid
import random
import time

SUPA_URL = "https://uolchtsfocyrbcalrknd.supabase.co"
SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvbGNodHNmb2N5cmJjYWxya25kIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTk2MDc2MywiZXhwIjoyMDkxNTM2NzYzfQ.zDKj7b7iGTWQl9INZjhR8zy8ZxP011jzeGnNuQ_D9io"

HEADERS = {
    "apikey": SUPA_KEY,
    "Authorization": f"Bearer {SUPA_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}


def patch_topic_id(old_id: str, new_id: str):
    """Rename all records from old_id to new_id."""
    r = requests.patch(
        f"{SUPA_URL}/rest/v1/question_bank?topic_id=eq.{old_id}",
        headers=HEADERS,
        json={"topic_id": new_id},
    )
    if r.status_code in (200, 204):
        print(f"  ✅ Renamed {old_id} → {new_id}")
    else:
        print(f"  ❌ Failed {old_id} → {new_id}: {r.status_code} {r.text}")


def insert_questions(rows: list[dict]):
    """Batch insert questions."""
    r = requests.post(
        f"{SUPA_URL}/rest/v1/question_bank",
        headers=HEADERS,
        json=rows,
    )
    if r.status_code in (200, 201):
        print(f"  ✅ Inserted {len(rows)} questions")
    else:
        print(f"  ❌ Insert failed: {r.status_code} {r.text[:200]}")


def count_existing(topic_id: str) -> int:
    r = requests.get(
        f"{SUPA_URL}/rest/v1/question_bank?topic_id=eq.{topic_id}&select=id",
        headers=HEADERS,
    )
    return len(r.json()) if r.status_code == 200 else 0


# ─────────────────────────────────────────────────────────────────
# STEP 1: Rename existing records to match app IDs
# ─────────────────────────────────────────────────────────────────
print("\n=== STEP 1: Renaming existing topic IDs ===")

RENAMES = {
    "counting-in-2s": "counting-2s",
    "counting-in-3s": "counting-3s",
    "counting-in-4s": "counting-4s",
    "counting-in-5s": "counting-5s",
    "counting-in-6s": "counting-6s",
    "counting-in-7s": "counting-7s",
    "counting-in-8s": "counting-8s",
    "counting-in-9s": "counting-9s",
    "counting-in-10s": "counting-10s",
    "addition-1-100": "addition-51-100",   # closest match — already have 1-10, rename this
    "addition-1-20": "addition-11-20",      # rename to 11-20
}

for old, new in RENAMES.items():
    n = count_existing(old)
    if n > 0:
        patch_topic_id(old, new)
    else:
        print(f"  ⚠️  {old} not found in bank, skipping")


# ─────────────────────────────────────────────────────────────────
# STEP 2: Generate times table questions (×2 through ×12)
# Each table: 20 questions, spread across year levels 2-6
# ─────────────────────────────────────────────────────────────────
print("\n=== STEP 2: Generating times table questions ===")

TIMES_YEAR_MAP = {
    2: 2, 5: 2, 10: 2,          # 2s, 5s, 10s → Year 2
    3: 3, 4: 3,                  # 3s, 4s → Year 3
    6: 4, 8: 4,                  # 6s, 8s → Year 4
    7: 4, 9: 4,                  # 7s, 9s → Year 4
    11: 5, 12: 5,                # 11s, 12s → Year 5
}

def times_hint(n: int, m: int) -> tuple[str, str, str]:
    product = n * m
    h1 = f"Think of {n} groups of {m}"
    h2 = f"Count up in {n}s, {m} times: " + ", ".join(str(n*i) for i in range(1, min(m+1, 6)))
    h3 = f"{n} × {m} = {product}"
    return h1, h2, h3

for n in range(2, 13):
    topic_id = f"times-{n}"
    existing = count_existing(topic_id)
    if existing >= 15:
        print(f"  ⏭️  {topic_id} already has {existing} questions, skipping")
        continue

    year = TIMES_YEAR_MAP.get(n, 4)
    rows = []
    multipliers = list(range(1, 13))
    random.shuffle(multipliers)

    for i, m in enumerate(multipliers):
        product = n * m
        h1, h2, h3 = times_hint(n, m)
        difficulty = 1 if m <= 4 else 2 if m <= 8 else 3
        rows.append({
            "id": str(uuid.uuid4()),
            "topic_id": topic_id,
            "year_level": year,
            "subject": "Maths",
            "question": f"What is {n} × {m}?",
            "answer": str(product),
            "input_type": "text",
            "options": [],
            "visual": json.dumps({"type": "dots", "rows": min(n, 10), "cols": min(m, 10)}),
            "difficulty": difficulty,
            "hint_1": h1,
            "hint_2": h2,
            "hint_3": h3,
            "tags": ["times-tables", f"×{n}"],
        })
        # Also add reversed (m × n) for variety
        if m != n:
            rows.append({
                "id": str(uuid.uuid4()),
                "topic_id": topic_id,
                "year_level": year,
                "subject": "Maths",
                "question": f"What is {m} × {n}?",
                "answer": str(product),
                "input_type": "text",
                "options": [],
                "visual": json.dumps({"type": "dots", "rows": min(m, 10), "cols": min(n, 10)}),
                "difficulty": difficulty,
                "hint_1": f"Think of {m} groups of {n}",
                "hint_2": f"{m} × {n} is the same as {n} × {m} = {product}",
                "hint_3": h3,
                "tags": ["times-tables", f"×{n}"],
            })

    print(f"  Inserting {len(rows)} questions for {topic_id}...")
    insert_questions(rows)
    time.sleep(0.3)


# ─────────────────────────────────────────────────────────────────
# STEP 3: Generate division questions (÷2 through ÷12)
# ─────────────────────────────────────────────────────────────────
print("\n=== STEP 3: Generating division questions ===")

DIV_YEAR_MAP = {2: 3, 5: 3, 10: 3, 3: 3, 4: 4, 6: 4, 8: 4, 7: 5, 9: 5, 11: 5, 12: 5}

for n in range(2, 13):
    topic_id = f"division-{n}"
    existing = count_existing(topic_id)
    if existing >= 10:
        print(f"  ⏭️  {topic_id} already has {existing} questions, skipping")
        continue

    year = DIV_YEAR_MAP.get(n, 4)
    rows = []
    multipliers = list(range(1, 13))
    random.shuffle(multipliers)

    for m in multipliers:
        dividend = n * m
        difficulty = 1 if m <= 4 else 2 if m <= 8 else 3
        rows.append({
            "id": str(uuid.uuid4()),
            "topic_id": topic_id,
            "year_level": year,
            "subject": "Maths",
            "question": f"What is {dividend} ÷ {n}?",
            "answer": str(m),
            "input_type": "text",
            "options": [],
            "visual": None,
            "difficulty": difficulty,
            "hint_1": f"Think: what number times {n} equals {dividend}?",
            "hint_2": f"{n} × ? = {dividend}",
            "hint_3": f"{dividend} ÷ {n} = {m}",
            "tags": ["division", f"÷{n}"],
        })

    print(f"  Inserting {len(rows)} questions for {topic_id}...")
    insert_questions(rows)
    time.sleep(0.3)


# ─────────────────────────────────────────────────────────────────
# STEP 4: Generate missing addition ranges
# ─────────────────────────────────────────────────────────────────
print("\n=== STEP 4: Generating addition range questions ===")

ADDITION_RANGES = [
    ("addition-21-50",  21, 50,  2, 25),
    ("addition-101-500", 101, 500, 4, 30),
    ("addition-501-1000", 501, 1000, 5, 25),
]

for topic_id, lo, hi, year, count in ADDITION_RANGES:
    existing = count_existing(topic_id)
    if existing >= 10:
        print(f"  ⏭️  {topic_id} already has {existing} questions, skipping")
        continue

    rows = []
    seen = set()
    attempts = 0
    while len(rows) < count and attempts < 200:
        attempts += 1
        a = random.randint(lo, hi)
        b = random.randint(lo, hi)
        if (a, b) in seen or (b, a) in seen:
            continue
        seen.add((a, b))
        total = a + b
        difficulty = 1 if total < lo * 2 else 2 if total < hi else 3
        rows.append({
            "id": str(uuid.uuid4()),
            "topic_id": topic_id,
            "year_level": year,
            "subject": "Maths",
            "question": f"What is {a} + {b}?",
            "answer": str(total),
            "input_type": "text",
            "options": [],
            "visual": None,
            "difficulty": difficulty,
            "hint_1": f"Start with {a}, then add {b}",
            "hint_2": f"Break it down: {a} + {b//10*10} = {a + b//10*10}, then add {b % 10}" if b >= 10 else f"{a} + {b} = ?",
            "hint_3": f"{a} + {b} = {total}",
            "tags": ["addition"],
        })

    print(f"  Inserting {len(rows)} questions for {topic_id}...")
    insert_questions(rows)
    time.sleep(0.3)


# ─────────────────────────────────────────────────────────────────
# STEP 5: Verify final state
# ─────────────────────────────────────────────────────────────────
print("\n=== STEP 5: Final verification ===")
APP_TOPICS = [
    "counting-2s","counting-3s","counting-4s","counting-5s","counting-6s",
    "counting-7s","counting-8s","counting-9s","counting-10s",
    "times-2","times-3","times-4","times-5","times-6","times-7",
    "times-8","times-9","times-10","times-11","times-12",
    "division-2","division-3","division-4","division-5","division-6",
    "division-7","division-8","division-9","division-10","division-11","division-12",
    "addition-1-10","addition-11-20","addition-21-50","addition-51-100",
    "addition-101-500","addition-501-1000",
]
for t in APP_TOPICS:
    n = count_existing(t)
    status = "✅" if n > 0 else "❌ STILL EMPTY"
    print(f"  {status} {t}: {n} questions")
