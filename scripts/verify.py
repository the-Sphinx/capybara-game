#!/usr/bin/env python3
"""
Step verification script.
- Takes a Playwright screenshot of the running app
- Gets git diff from the last commit
- Reads plan context from docs/
- Calls Claude claude-sonnet-4-6 for a verdict
- Posts the verdict as a comment on the GitHub issue
"""

import base64
import os
import subprocess
import sys
from pathlib import Path

import anthropic
import requests
from playwright.sync_api import sync_playwright


SCREENSHOT_PATH = "/tmp/capy_screenshot.png"
APP_URL = "http://localhost:4173"


def take_screenshot() -> bytes:
    print("Taking screenshot...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        page.goto(APP_URL, wait_until="networkidle")
        page.wait_for_timeout(2000)
        page.screenshot(path=SCREENSHOT_PATH, full_page=False)
        browser.close()
    with open(SCREENSHOT_PATH, "rb") as f:
        data = f.read()
    print(f"Screenshot saved: {SCREENSHOT_PATH} ({len(data)} bytes)")
    return data


def get_git_diff() -> str:
    print("Getting git diff...")
    try:
        stat = subprocess.check_output(
            ["git", "diff", "HEAD~1", "HEAD", "--stat"],
            stderr=subprocess.DEVNULL,
            text=True,
        )
        diff = subprocess.check_output(
            [
                "git", "diff", "HEAD~1", "HEAD", "--",
                "*.js", "*.ts", "*.html", "*.css",
                "*.yml", "*.yaml", "*.py", "*.json",
            ],
            stderr=subprocess.DEVNULL,
            text=True,
        )
        result = f"=== STAT ===\n{stat}\n=== DIFF ===\n{diff}"
    except subprocess.CalledProcessError:
        # First commit — no parent, show the whole commit instead
        print("No parent commit found, using git show HEAD")
        result = subprocess.check_output(
            ["git", "show", "HEAD", "--stat", "--unified=3"],
            text=True,
        )

    # Truncate to 4000 chars to stay within context limits
    if len(result) > 4000:
        result = result[:4000] + "\n...[truncated]"
    return result


def get_plan_context() -> str:
    print("Reading plan context...")
    docs = Path("docs")
    candidates = [
        docs / "plan.md",
        *sorted(docs.glob("capy_village_step_*.md")),
    ]
    for path in candidates:
        if path.exists():
            text = path.read_text(encoding="utf-8")
            if len(text) > 2000:
                text = text[:2000] + "\n...[truncated]"
            print(f"Plan context from: {path}")
            return text
    print("No plan doc found.")
    return "(no plan document found)"


def call_claude(screenshot_bytes: bytes, diff: str, plan: str) -> str:
    print("Calling Claude for verdict...")
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    screenshot_b64 = base64.standard_b64encode(screenshot_bytes).decode()

    prompt = f"""You are a code reviewer for the Capybara Game project.

Review the following push to `main` and provide a structured verdict.

---
## Plan Context
{plan}

---
## Code Diff (last commit)
```
{diff}
```

---
## Instructions
Look at the screenshot of the running app and the code changes above.

Provide:
1. **Visual Check** — Does the app render correctly? Describe what you see.
2. **Code Quality** — Any issues with the diff? (bugs, style, security, correctness)
3. **Plan Alignment** — Do the changes match what was planned?
4. **Final Verdict** — End with exactly one of:
   - `✅ APPROVED` — everything looks good
   - `⚠️ NEEDS ATTENTION` — works but has minor issues
   - `❌ BLOCKED` — critical problem, do not proceed

Keep your response under 400 words."""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1500,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/png",
                            "data": screenshot_b64,
                        },
                    },
                    {"type": "text", "text": prompt},
                ],
            }
        ],
    )
    return response.content[0].text


def post_github_comment(verdict: str) -> None:
    repo = os.environ.get("GITHUB_REPOSITORY", "")
    issue_number = os.environ.get("VERIFY_ISSUE_NUMBER", "")
    token = os.environ.get("GITHUB_TOKEN", "")
    sha = os.environ.get("GITHUB_SHA", "unknown")
    run_id = os.environ.get("GITHUB_RUN_ID", "")

    if not all([repo, issue_number, token]):
        print("Missing GITHUB_REPOSITORY, VERIFY_ISSUE_NUMBER, or GITHUB_TOKEN — skipping comment")
        print("Verdict:\n", verdict)
        return

    run_url = f"https://github.com/{repo}/actions/runs/{run_id}" if run_id else ""

    body = (
        f"## Step Verification — `{sha[:8]}`\n\n"
        f"{verdict}\n\n"
        f"---\n"
        f"*Workflow run: [{run_url}]({run_url})*"
    ) if run_url else (
        f"## Step Verification — `{sha[:8]}`\n\n"
        f"{verdict}"
    )

    url = f"https://api.github.com/repos/{repo}/issues/{issue_number}/comments"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    resp = requests.post(url, json={"body": body}, headers=headers, timeout=30)
    if resp.status_code == 201:
        print(f"Comment posted to issue #{issue_number}: {resp.json().get('html_url')}")
    else:
        print(f"Failed to post comment: {resp.status_code} {resp.text}", file=sys.stderr)
        sys.exit(1)


def main():
    screenshot_bytes = take_screenshot()
    diff = get_git_diff()
    plan = get_plan_context()
    verdict = call_claude(screenshot_bytes, diff, plan)
    print("=== VERDICT ===")
    print(verdict)
    post_github_comment(verdict)


if __name__ == "__main__":
    main()
