#!/usr/bin/env python3
"""
earni-drip-emails.py — Learni parent email drip sequence
Runs daily at 2am UTC (2pm NZST) via cron: 0 2 * * *

Drip schedule:
  Day 1  — Welcome (skip if already sent by welcome API)
  Day 3  — "Has [child] tried the baseline test yet?" (only if no baseline_results)
  Day 7  — "Here's what [child] learned this week" (mini digest)
  Day 12 — "Your trial ends in 2 days — here's what you'll lose"
"""

import os
import sys
import json
import smtplib
import requests
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import anthropic

# ── Config ────────────────────────────────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://uolchtsfocyrbcalrknd.supabase.co")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

SMTP_HOST = "smtppro.zoho.com.au"
SMTP_PORT = 587
EMAIL_FROM = os.environ.get("EMAIL_FROM", "hello@learniapp.co")
EMAIL_PASS = os.environ.get("EMAIL_PASS", "")
EMAIL_NAME = "Earni from Learni"

CLAUDE_MODEL = "claude-sonnet-4-20250514"
ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

# ── Branded HTML signature ────────────────────────────────────────────────────
SIGNATURE = """
<table cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;border-top:1px solid #e8f0ef;padding-top:20px;width:100%">
  <tr>
    <td style="vertical-align:top;padding-right:16px;width:64px">
      <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(145deg,#2ec4b6,#1a9e92);text-align:center;line-height:48px;font-size:24px;color:white;font-weight:900;font-family:'Nunito',sans-serif">E</div>
    </td>
    <td style="vertical-align:top">
      <div style="font-family:'Nunito',sans-serif;font-weight:900;font-size:16px;color:#0d2b28">Earni</div>
      <div style="font-size:12px;color:#5a8a84;margin-top:2px">AI Tutor at Learni</div>
      <div style="margin-top:8px">
        <a href="https://learniapp.co" style="color:#2ec4b6;text-decoration:none;font-size:13px;font-weight:600">learniapp.co</a>
        <span style="color:#ccc;margin:0 6px">·</span>
        <a href="mailto:hello@learniapp.co" style="color:#5a8a84;text-decoration:none;font-size:13px">hello@learniapp.co</a>
      </div>
      <div style="margin-top:10px;font-size:11px;color:#8abfba;font-style:italic">Learn it. Earn it. ✨</div>
    </td>
  </tr>
</table>
"""

# ── Supabase helpers ──────────────────────────────────────────────────────────
def sb_get(path, params=None):
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=headers, params=params)
    r.raise_for_status()
    return r.json()

def sb_patch(path, params, data):
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    r = requests.patch(f"{SUPABASE_URL}/rest/v1/{path}", headers=headers, params=params, json=data)
    r.raise_for_status()
    return r

# ── Claude personalisation ────────────────────────────────────────────────────
def personalise_email(prompt: str) -> str:
    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    msg = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=500,
        messages=[{"role": "user", "content": prompt}]
    )
    return msg.content[0].text.strip()

# ── Email sender ──────────────────────────────────────────────────────────────
def send_email(to_email: str, subject: str, plain_body: str, html_body: str):
    msg = MIMEMultipart("alternative")
    msg["From"] = f"{EMAIL_NAME} <{EMAIL_FROM}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(plain_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(EMAIL_FROM, EMAIL_PASS)
        server.sendmail(EMAIL_FROM, to_email, msg.as_string())
    print(f"  ✓ Sent to {to_email}")

def wrap_html(body_html: str, headline: str = "") -> str:
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="font-family:-apple-system,'Nunito','Segoe UI',sans-serif;color:#0d2b28;max-width:560px;margin:0 auto;padding:20px;background:#fff">
  <div style="text-align:center;margin-bottom:24px;padding:24px 0 16px">
    <div style="font-family:'Nunito',sans-serif;font-size:26px;font-weight:900;color:#0d2b28;letter-spacing:-0.5px">
      learni<span style="color:#2ec4b6">.</span>
    </div>
  </div>
  {'<h2 style="font-family:Nunito,sans-serif;font-size:24px;font-weight:900;color:#0d2b28;margin-bottom:16px">' + headline + '</h2>' if headline else ''}
  <div style="font-size:15px;color:#3a6660;line-height:1.6">
    {body_html}
  </div>
  {SIGNATURE}
</body></html>"""

def text_to_html_paras(text: str) -> str:
    paras = [p.strip() for p in text.split("\n\n") if p.strip()]
    return "".join(f'<p style="margin:0 0 14px">{p.replace(chr(10), "<br>")}</p>' for p in paras)

# ── Drip email definitions ────────────────────────────────────────────────────
def email_day3_baseline(parent_name: str, child_name: str, child_age: int) -> tuple[str, str, str]:
    """Day 3: nudge to do baseline test if not done."""
    prompt = f"""You are Earni, the AI tutor at Learni (learniapp.co).
Write a short, warm email (3 paragraphs max) to {parent_name}, parent of {child_name} (age {child_age}).
The family signed up 3 days ago. {child_name} hasn't done the baseline assessment yet.

The baseline assessment is a quick 5-minute level-finder Earni runs on the first session. It personalises everything from day one — without it, Earni is just guessing.

Encourage them gently. Be specific about what the baseline does. Sign off as Earni.
DO NOT include a subject line. Just the email body in plain text paragraphs."""
    
    body = personalise_email(prompt)
    subject = f"Has {child_name} tried their first session yet? 👋"
    return subject, body, wrap_html(
        text_to_html_paras(body) + f"""
<div style="text-align:center;margin:24px 0">
  <a href="https://learniapp.co/dashboard" style="display:inline-block;background:#2ec4b6;color:white;padding:12px 28px;border-radius:28px;font-family:'Nunito',sans-serif;font-weight:900;font-size:15px;text-decoration:none">
    Start {child_name}'s first session →
  </a>
</div>"""
    )

def email_day7_digest(
    parent_name: str, child_name: str,
    sessions_this_week: int, stars_this_week: int,
    subjects_covered: list, strong_topics: list
) -> tuple[str, str, str]:
    """Day 7: weekly digest — what the child learned."""
    subjects_str = ", ".join(subjects_covered) if subjects_covered else "various subjects"
    strong_str = ", ".join(strong_topics[:3]) if strong_topics else "several topics"
    
    prompt = f"""You are Earni, the AI tutor at Learni (learniapp.co).
Write a short, enthusiastic weekly digest email (3–4 paragraphs) to {parent_name}, parent of {child_name}.

This week's stats:
- Sessions completed: {sessions_this_week}
- Stars earned: {stars_this_week}
- Subjects covered: {subjects_str}
- Strong topics: {strong_str}

Make them feel proud of {child_name}'s progress. Mention 1–2 specific things. Keep it upbeat and real. Sign off as Earni.
DO NOT include a subject line. Just the email body in plain text."""
    
    body = personalise_email(prompt)
    subject = f"Here's what {child_name} learned this week 📚"
    
    stats_html = f"""
<div style="background:#f7fafa;border-radius:14px;padding:16px 20px;margin:16px 0;font-size:14px;color:#5a8a84">
  <div style="font-weight:700;color:#0d2b28;margin-bottom:8px">This week:</div>
  <div>⭐ {stars_this_week} stars earned</div>
  <div>📚 {sessions_this_week} session{"s" if sessions_this_week != 1 else ""} completed</div>
  <div>📖 {subjects_str}</div>
</div>
<div style="text-align:center;margin:24px 0">
  <a href="https://learniapp.co/dashboard" style="display:inline-block;background:#2ec4b6;color:white;padding:12px 28px;border-radius:28px;font-family:'Nunito',sans-serif;font-weight:900;font-size:15px;text-decoration:none">
    See the full Hub →
  </a>
</div>"""
    
    return subject, body, wrap_html(text_to_html_paras(body) + stats_html)

def email_day12_trial_ending(parent_name: str, child_name: str, days_left: int) -> tuple[str, str, str]:
    """Day 12: trial ends in 2 days — urgency email."""
    prompt = f"""You are Earni, the AI tutor at Learni (learniapp.co).
Write a warm but urgent email (3 paragraphs) to {parent_name}. {child_name}'s 14-day free trial ends in {days_left} days.

Remind them what they'll lose (unlimited AI voice tutoring, real money rewards, baseline assessment, weekly digest, achievement badges).
Learni costs $49/month NZD — less than ONE Kip McGrath session.
Be honest and human — not pushy. Sign off as Earni.
DO NOT include a subject line. Just the email body in plain text."""
    
    body = personalise_email(prompt)
    subject = f"⚠️ {child_name}'s free trial ends in {days_left} days"
    
    upgrade_html = f"""
<div style="background:#fff8e8;border:1px solid #f5a623;border-radius:14px;padding:16px 20px;margin:16px 0;font-size:14px">
  <div style="font-weight:700;color:#0d2b28;margin-bottom:8px">What {child_name} loses if you don't upgrade:</div>
  <div style="color:#5a8a84;line-height:1.7">
    ✗ Unlimited AI voice tutoring sessions<br>
    ✗ Real money reward tracking<br>
    ✗ Achievement badges and streak tracking<br>
    ✗ Weekly parent digest emails<br>
    ✗ Progress reports across all subjects
  </div>
</div>
<div style="text-align:center;margin:24px 0">
  <a href="https://learniapp.co/subscribe" style="display:inline-block;background:#2ec4b6;color:white;padding:14px 32px;border-radius:28px;font-family:'Nunito',sans-serif;font-weight:900;font-size:16px;text-decoration:none;box-shadow:0 4px 16px rgba(46,196,182,0.3)">
    Keep {child_name} learning →
  </a>
  <div style="margin-top:10px;font-size:12px;color:#8abfba">$49/month NZD · Cancel anytime · One click</div>
</div>"""
    
    return subject, body, wrap_html(text_to_html_paras(body) + upgrade_html)

# ── Main drip logic ───────────────────────────────────────────────────────────
def run_drip():
    print(f"\n{'='*60}")
    print(f"Learni drip emails — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"{'='*60}\n")

    now = datetime.now(timezone.utc)

    # Fetch all trial/active accounts
    accounts = sb_get("accounts", params={
        "select": "id,email,full_name,plan,trial_ends_at,subscription_status,email_drip_sent",
        "or": "(plan.eq.trial,subscription_status.eq.trialing)",
        "order": "id",
    })

    print(f"Found {len(accounts)} trial accounts\n")

    for account in accounts:
        acct_id = account["id"]
        email = account.get("email", "")
        parent_name = (account.get("full_name") or "there").split()[0]  # first name
        drip_sent = account.get("email_drip_sent") or {}
        trial_ends = account.get("trial_ends_at")

        if not email:
            continue

        # Calculate days since account creation (approximate from trial_ends_at - 14 days)
        if not trial_ends:
            continue
        trial_end_dt = datetime.fromisoformat(trial_ends.replace("Z", "+00:00"))
        created_at = trial_end_dt - timedelta(days=14)
        days_since_signup = (now - created_at).days
        days_left_in_trial = max(0, (trial_end_dt - now).days)

        print(f"  Account: {email} | Day {days_since_signup} | {days_left_in_trial}d left in trial")

        # Fetch first child for this account
        children = sb_get("learners", params={
            "select": "id,name,age,baseline_results",
            "account_id": f"eq.{acct_id}",
            "limit": 1,
        })
        if not children:
            print(f"    → No children, skipping")
            continue

        child = children[0]
        child_id = child["id"]
        child_name = child.get("name", "your child")
        child_age = child.get("age") or 8
        has_baseline = bool(child.get("baseline_results"))

        # ── Day 3: baseline nudge (only if no baseline done) ──────────────────
        if days_since_signup >= 3 and "day3" not in drip_sent and not has_baseline:
            print(f"    → Sending Day 3 baseline nudge")
            try:
                subject, plain, html = email_day3_baseline(parent_name, child_name, child_age)
                send_email(email, subject, plain, html)
                drip_sent["day3"] = now.isoformat()
                sb_patch("accounts", {"id": f"eq.{acct_id}"}, {"email_drip_sent": json.dumps(drip_sent)})
            except Exception as e:
                print(f"    ✗ Day 3 email failed: {e}")

        # ── Day 7: weekly digest ───────────────────────────────────────────────
        elif days_since_signup >= 7 and "day7" not in drip_sent:
            print(f"    → Sending Day 7 digest")
            try:
                # Get sessions from last 7 days
                week_ago = (now - timedelta(days=7)).isoformat()
                sessions = sb_get("sessions", params={
                    "select": "subject,stars_earned,strong_topics",
                    "learner_id": f"eq.{child_id}",
                    "completed_at": f"gte.{week_ago}",
                })
                sessions_count = len(sessions)
                stars_total = sum(s.get("stars_earned", 0) for s in sessions)
                subjects = list(set(s.get("subject", "") for s in sessions if s.get("subject")))
                strong = []
                for s in sessions:
                    strong.extend(s.get("strong_topics") or [])
                strong = list(set(strong))

                subject, plain, html = email_day7_digest(
                    parent_name, child_name,
                    sessions_count, stars_total, subjects, strong
                )
                send_email(email, subject, plain, html)
                drip_sent["day7"] = now.isoformat()
                sb_patch("accounts", {"id": f"eq.{acct_id}"}, {"email_drip_sent": json.dumps(drip_sent)})
            except Exception as e:
                print(f"    ✗ Day 7 email failed: {e}")

        # ── Day 12: trial ending soon ──────────────────────────────────────────
        elif days_since_signup >= 12 and "day12" not in drip_sent and days_left_in_trial <= 2:
            print(f"    → Sending Day 12 trial ending")
            try:
                subject, plain, html = email_day12_trial_ending(parent_name, child_name, days_left_in_trial)
                send_email(email, subject, plain, html)
                drip_sent["day12"] = now.isoformat()
                sb_patch("accounts", {"id": f"eq.{acct_id}"}, {"email_drip_sent": json.dumps(drip_sent)})
            except Exception as e:
                print(f"    ✗ Day 12 email failed: {e}")

        else:
            print(f"    → No email due today")

    print(f"\n{'='*60}")
    print("Done.")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    run_drip()
