#!/usr/bin/env python3
"""
build.py — Cosmos site builder
================================
Reads all .md files from posts/research/ and posts/blogs/,
then generates js/data.js automatically.

USAGE:
    python build.py

Run this every time you add or edit a post, then do:
    git add .
    git commit -m "update posts"
    git push

MARKDOWN FILE FORMAT:
    Each .md file must start with a YAML front matter block
    between --- lines, followed by the English content,
    then an optional ---zh--- divider and Chinese content.

    Example:
    ---
    id: blog-2025-04
    emoji: 🚀
    image: ""
    date: 2025-04-01
    title: My English Title
    title_zh: 我的中文标题
    excerpt: Short English summary for the card.
    excerpt_zh: 显示在卡片上的中文摘要。
    ---

    # English content here (Markdown)

    ---zh---

    # 中文内容写在这里（Markdown）
"""

import os
import re
import json
from pathlib import Path
from datetime import datetime

# ── paths ──────────────────────────────────────────────────────────
ROOT        = Path(__file__).parent
POSTS_DIR   = ROOT / "posts"
RESEARCH_DIR = POSTS_DIR / "research"
BLOGS_DIR   = POSTS_DIR / "blogs"
OUTPUT      = ROOT / "js" / "data.js"
CONFIG      = ROOT / "js" / "config.js"   # your personal info lives here

# ── helpers ────────────────────────────────────────────────────────

def parse_md(filepath: Path) -> dict:
    """Parse a .md file with YAML front matter and optional ---zh--- divider."""
    text = filepath.read_text(encoding="utf-8")

    # --- Extract front matter ---
    fm_match = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.DOTALL)
    if not fm_match:
        raise ValueError(f"No front matter found in {filepath.name}\n"
                         f"File must start with:\n---\nid: ...\ntitle: ...\n---")
    fm_text = fm_match.group(1)
    body    = text[fm_match.end():]

    # Simple YAML key: value parser (no nesting needed)
    meta = {}
    for line in fm_text.splitlines():
        m = re.match(r'^(\w+)\s*:\s*(.*)', line)
        if m:
            key, val = m.group(1), m.group(2).strip()
            # Strip surrounding quotes if present
            if (val.startswith('"') and val.endswith('"')) or \
               (val.startswith("'") and val.endswith("'")):
                val = val[1:-1]
            meta[key] = val

    # --- Split English / Chinese content ---
    if "---zh---" in body:
        en_body, zh_body = body.split("---zh---", 1)
    else:
        en_body = body
        zh_body = ""

    # Required fields
    required = ["id", "date", "title", "title_zh", "excerpt", "excerpt_zh"]
    for field in required:
        if field not in meta:
            raise ValueError(f"Missing field '{field}' in front matter of {filepath.name}")

    return {
        "id":         meta["id"],
        "emoji":      meta.get("emoji", "📄"),
        "image":      meta.get("image", ""),
        "date":       meta["date"],
        "title":      meta["title"],
        "title_zh":   meta["title_zh"],
        "excerpt":    meta["excerpt"],
        "excerpt_zh": meta["excerpt_zh"],
        "content":    en_body.strip(),
        "content_zh": zh_body.strip(),
    }


def load_posts(directory: Path) -> list:
    """Load and sort all .md files in a directory, newest first."""
    if not directory.exists():
        print(f"  ⚠  Directory not found: {directory} — skipping")
        return []

    posts = []
    for md_file in sorted(directory.glob("*.md")):
        try:
            post = parse_md(md_file)
            posts.append(post)
            print(f"  ✓  {md_file.name}")
        except Exception as e:
            print(f"  ✗  {md_file.name}: {e}")

    # Sort by date descending (newest first)
    posts.sort(key=lambda p: p["date"], reverse=True)
    return posts


def js_string(s: str) -> str:
    """Escape a string for use inside a JS template literal (backtick string)."""
    return s.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")


def post_to_js(post: dict, indent: str = "    ") -> str:
    """Render a post dict as a JS object literal."""
    lines = ["{"]
    lines.append(f'  id:         {json.dumps(post["id"])},')
    lines.append(f'  emoji:      {json.dumps(post["emoji"])},')
    lines.append(f'  image:      {json.dumps(post["image"])},')
    lines.append(f'  date:       {json.dumps(post["date"])},')
    lines.append(f'  title:      {json.dumps(post["title"])},')
    lines.append(f'  title_zh:   {json.dumps(post["title_zh"])},')
    lines.append(f'  excerpt:    {json.dumps(post["excerpt"])},')
    lines.append(f'  excerpt_zh: {json.dumps(post["excerpt_zh"])},')
    lines.append(f'  content: `\n{js_string(post["content"])}\n  `,')
    lines.append(f'  content_zh: `\n{js_string(post["content_zh"])}\n  `')
    lines.append("}")
    return ("\n" + indent).join(lines)


# ── read config.js for personal info ───────────────────────────────

def read_config() -> str:
    """Read config.js which contains i18n and about sections."""
    if not CONFIG.exists():
        raise FileNotFoundError(
            f"config.js not found at {CONFIG}\n"
            f"Expected: js/config.js containing i18n and about sections."
        )
    return CONFIG.read_text(encoding="utf-8")


# ── main build ─────────────────────────────────────────────────────

def build():
    print("\n🚀 Cosmos site builder")
    print("=" * 40)

    # Load posts
    print("\nLoading research posts...")
    research = load_posts(RESEARCH_DIR)

    print("\nLoading blog posts...")
    blogs = load_posts(BLOGS_DIR)

    print(f"\nTotal: {len(research)} research, {len(blogs)} blogs")

    # Read config
    try:
        config_content = read_config()
    except FileNotFoundError as e:
        print(f"\n✗ {e}")
        return

    # Build research array
    research_js = ",\n\n    ".join(post_to_js(p, "    ") for p in research)
    blogs_js    = ",\n\n    ".join(post_to_js(p, "    ") for p in blogs)

    # Generate data.js
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    output = f"""// ============================================================
//  js/data.js — AUTO-GENERATED by build.py
//  Last built: {now}
//
//  ⚠  DO NOT edit this file directly.
//     Edit your posts in:  posts/research/*.md
//                          posts/blogs/*.md
//     Edit personal info in: js/config.js
//     Then run:  python build.py
// ============================================================

{config_content}

// ── Posts (auto-generated from posts/ folder) ─────────────

window.SITE_DATA.research = [
    {research_js}
];

window.SITE_DATA.blogs = [
    {blogs_js}
];
"""

    OUTPUT.write_text(output, encoding="utf-8")
    print(f"\n✅ Written to {OUTPUT}")
    print("\nNext steps:")
    print("  git add .")
    print('  git commit -m "update posts"')
    print("  git push")
    print()


if __name__ == "__main__":
    build()
