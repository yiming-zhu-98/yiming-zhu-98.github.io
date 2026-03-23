#!/usr/bin/env python3
"""
build.py — Cosmos site builder
================================
Reads all .md files from posts/research/ and posts/blogs/,
then generates js/data.js.

JSDELIVR CDN:
    Set GITHUB_USER and GITHUB_REPO below.
    All  images/xxx  paths will be auto-converted to jsDelivr URLs.
    Leave GITHUB_USER = "" to disable (use local paths as-is).

USAGE:
    python build.py

Then:
    git add .
    git commit -m "update posts"
    git push
"""

import os, re, json
from pathlib import Path
from datetime import datetime

# ============================================================
#  ✅ CONFIGURE HERE
# ============================================================

GITHUB_USER = "yiming-zhu-98"          # your GitHub username
GITHUB_REPO = "yiming-zhu-98.github.io"   # your repository name
GITHUB_BRANCH = "version1"                  # branch (usually main or master)

# Set to True to use jsDelivr CDN for all images/
USE_CDN = True

# ============================================================

ROOT         = Path(__file__).parent
RESEARCH_DIR = ROOT / "posts" / "research"
BLOGS_DIR    = ROOT / "posts" / "blogs"
OUTPUT       = ROOT / "js" / "data.js"

# CDN_BASE 支持两种模式，取消注释其中一行：
# 模式1：jsDelivr CDN（有缓存延迟，国内较快）
CDN_BASE = f"https://cdn.jsdelivr.net/gh/{GITHUB_USER}/{GITHUB_REPO}@{GITHUB_BRANCH}" if USE_CDN and GITHUB_USER else ""
# 模式2：GitHub raw（无缓存延迟，直接可用）
# CDN_BASE = (
#     f"https://raw.githubusercontent.com/{GITHUB_USER}/{GITHUB_REPO}/{GITHUB_BRANCH}"
#     if USE_CDN and GITHUB_USER else ""
# )


def to_cdn(path: str) -> str:
    """Convert a local images/xxx path to a jsDelivr CDN URL."""
    if not CDN_BASE or not path:
        return path
    # Already a full URL — leave as-is
    if path.startswith("http://") or path.startswith("https://"):
        return path
    # Local path like  images/photo.jpg  →  CDN_BASE/images/photo.jpg
    clean = path.lstrip("./")
    return f"{CDN_BASE}/{clean}"


def cdn_md(text: str) -> str:
    """Replace all  ![alt](images/...)  and  <img src="images/...">  in markdown."""
    if not CDN_BASE:
        return text
    # Markdown image syntax: ![alt](images/file.jpg)
    text = re.sub(
        r'!\[([^\]]*)\]\((images/[^)]+)\)',
        lambda m: f'![{m.group(1)}]({to_cdn(m.group(2))})',
        text
    )
    # HTML img tags: <img src="images/file.jpg" ...>
    text = re.sub(
        r'(<img\s[^>]*src=")([^"]*images/[^"]+)(")',
        lambda m: f'{m.group(1)}{to_cdn(m.group(2))}{m.group(3)}',
        text
    )
    return text


def parse_md(filepath: Path) -> dict:
    text = filepath.read_text(encoding="utf-8")
    fm_match = re.match(r"^---\s*\n(.*?)\n---\s*\n", text, re.DOTALL)
    if not fm_match:
        raise ValueError(f"No front matter found in {filepath.name}")
    fm_text = fm_match.group(1)
    body    = text[fm_match.end():]

    meta = {}
    for line in fm_text.splitlines():
        m = re.match(r'^(\w+)\s*:\s*(.*)', line)
        if m:
            key, val = m.group(1), m.group(2).strip()
            if (val.startswith('"') and val.endswith('"')) or \
               (val.startswith("'") and val.endswith("'")):
                val = val[1:-1]
            meta[key] = val

    en_body, zh_body = (body.split("---zh---", 1) + [""])[:2]

    for field in ["id", "date", "title", "title_zh", "excerpt", "excerpt_zh"]:
        if field not in meta:
            raise ValueError(f"Missing '{field}' in {filepath.name}")

    # Convert image paths in front matter and body content
    cover_image = to_cdn(meta.get("image", ""))
    en_content  = cdn_md(en_body.strip())
    zh_content  = cdn_md(zh_body.strip())

    return {
        "id":         meta["id"],
        "emoji":      meta.get("emoji", "📄"),
        "image":      cover_image,
        "date":       meta["date"],
        "title":      meta["title"],
        "title_zh":   meta["title_zh"],
        "excerpt":    meta["excerpt"],
        "excerpt_zh": meta["excerpt_zh"],
        "content":    en_content,
        "content_zh": zh_content,
    }


def load_posts(directory: Path) -> list:
    if not directory.exists():
        print(f"  ⚠  Not found: {directory}")
        return []
    posts = []
    for md_file in sorted(directory.glob("*.md")):
        try:
            posts.append(parse_md(md_file))
            print(f"  ✓  {md_file.name}")
        except Exception as e:
            print(f"  ✗  {md_file.name}: {e}")
    posts.sort(key=lambda p: p["date"], reverse=True)
    return posts


def js_str(s: str) -> str:
    return s.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")


def post_to_js(post: dict) -> str:
    lines = [
        "  {",
        f'    id:         {json.dumps(post["id"])},',
        f'    emoji:      {json.dumps(post["emoji"])},',
        f'    image:      {json.dumps(post["image"])},',
        f'    date:       {json.dumps(post["date"])},',
        f'    title:      {json.dumps(post["title"])},',
        f'    title_zh:   {json.dumps(post["title_zh"])},',
        f'    excerpt:    {json.dumps(post["excerpt"])},',
        f'    excerpt_zh: {json.dumps(post["excerpt_zh"])},',
        f'    content: `\n{js_str(post["content"])}\n    `,',
        f'    content_zh: `\n{js_str(post["content_zh"])}\n    `',
        "  }",
    ]
    return "\n".join(lines)


def build():
    print("\n🚀 Cosmos site builder")
    print("=" * 40)

    if CDN_BASE:
        print(f"\n📦 CDN: {CDN_BASE}")
    else:
        print("\n📦 CDN: disabled (local paths)")

    print("\nLoading research posts...")
    research = load_posts(RESEARCH_DIR)

    print("\nLoading blog posts...")
    blogs = load_posts(BLOGS_DIR)

    print(f"\nTotal: {len(research)} research, {len(blogs)} blogs")

    research_js = ",\n\n".join(post_to_js(p) for p in research)
    blogs_js    = ",\n\n".join(post_to_js(p) for p in blogs)

    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    cdn_note = f"CDN: {CDN_BASE}" if CDN_BASE else "CDN: disabled"
    output = f"""// ============================================================
//  js/data.js — AUTO-GENERATED by build.py
//  Last built: {now}
//  {cdn_note}
//
//  ⚠  DO NOT edit this file directly.
//     • Edit posts in:       posts/research/*.md
//                            posts/blogs/*.md
//     • Edit CDN settings:   build.py (top of file)
//     • Edit personal info:  js/config.js
//     • Then run:            python build.py
// ============================================================

// Append posts to the SITE_DATA object already created by config.js
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
    print("  git push\n")


if __name__ == "__main__":
    build()