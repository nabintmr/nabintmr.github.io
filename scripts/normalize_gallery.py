#!/usr/bin/env python3
"""
normalize_gallery.py — Synchronizes and normalizes gallery images chronologically.

Features:
1. Discovers all images in assets/images/gallery/
2. Extracts capture/creation time (EXIF Date Taken, WhatsApp sequence, or file creation time)
3. Sorts images chronologically
4. Normalizes names to gallery-01.jpg, gallery-02.jpg, ...
5. Automatically syncs <div class="gallery-grid"> in gallery.html
"""

import os
import re
import struct
import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GALLERY_DIR = ROOT / "assets" / "images" / "gallery"
GALLERY_HTML = ROOT / "gallery.html"

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def get_exif_datetime(filepath):
    """Extract EXIF datetime from JPEG without external dependencies."""
    try:
        with open(filepath, "rb") as f:
            data = f.read(65536)  # Read first 64KB for APP1
        if len(data) < 4 or data[:2] != b"\xff\xd8":
            return None
        idx = 2
        while idx < len(data) - 4:
            if data[idx] != 0xff:
                break
            marker = data[idx + 1]
            if marker in (0xd9, 0xda):  # EOI or SOS
                break
            length = struct.unpack(">H", data[idx + 2:idx + 4])[0]
            if marker == 0xe1:  # APP1
                app1 = data[idx + 4:idx + 2 + length]
                if app1.startswith(b"Exif\x00\x00"):
                    matches = re.findall(b"(\\d{4}:\\d{2}:\\d{2} \\d{2}:\\d{2}:\\d{2})", app1)
                    if matches:
                        dt_str = matches[0].decode("ascii", errors="ignore")
                        return datetime.datetime.strptime(dt_str, "%Y:%m:%d %H:%M:%S")
            idx += 2 + length
    except Exception:
        pass
    return None


def get_sort_key(filename):
    filepath = GALLERY_DIR / filename
    # 1. Try EXIF
    exif_dt = get_exif_datetime(filepath)
    if exif_dt:
        return (0, exif_dt.timestamp(), filename)

    # 2. Match WhatsApp filename: IMG-YYYYMMDD-WAxxxx
    m_wa = re.search(r"IMG-(\d{8})-WA(\d{4})", filename)
    if m_wa:
        date_part, seq_part = m_wa.groups()
        return (1, int(date_part), int(seq_part), filename)

    # 3. Match existing gallery-NN
    m_gal = re.search(r"gallery-(\d+)", filename)
    if m_gal:
        return (2, int(m_gal.group(1)), filename)

    # 4. Fallback to filesystem creation/modification time
    try:
        stat = os.stat(filepath)
        ctime = getattr(stat, "st_birthtime", stat.st_ctime)
        return (3, ctime, filename)
    except Exception:
        return (4, 0, filename)


def update_gallery_html(image_filenames):
    if not GALLERY_HTML.exists():
        print(f"Warning: {GALLERY_HTML} not found.")
        return

    content = GALLERY_HTML.read_text(encoding="utf-8")
    grid_pattern = re.compile(
        r'(<div class="gallery-grid">)(.*?)(</div>\s*</div>\s*</section>)',
        re.DOTALL
    )

    match = grid_pattern.search(content)
    if not match:
        print("Could not find gallery-grid in gallery.html")
        return

    new_items = []
    for idx, fname in enumerate(image_filenames, start=1):
        rel_path = f"assets/images/gallery/{fname}"
        item = f'          <a href="{rel_path}"><img src="{rel_path}" alt="Community outreach moment {idx}" loading="lazy" decoding="async"></a>'
        new_items.append(item)

    new_grid_content = "\n" + "\n".join(new_items) + "\n        "
    updated_html = content[:match.start(2)] + new_grid_content + content[match.end(2):]
    GALLERY_HTML.write_text(updated_html, encoding="utf-8")
    print(f"Updated {GALLERY_HTML.name} with {len(image_filenames)} photos.")


def main():
    if not GALLERY_DIR.exists():
        print(f"Gallery directory {GALLERY_DIR} does not exist.")
        return

    files = [f for f in os.listdir(GALLERY_DIR) if Path(f).suffix.lower() in IMAGE_EXTENSIONS]
    if not files:
        print("No images found in gallery directory.")
        return

    sorted_files = sorted(files, key=get_sort_key)
    print(f"Found {len(sorted_files)} gallery photos. Normalizing order...")

    # Two-pass rename to prevent collisions
    temp_names = []
    for idx, fname in enumerate(sorted_files, start=1):
        temp_name = f"__gal_tmp_{idx:03d}.jpg"
        temp_names.append(temp_name)
        src = GALLERY_DIR / fname
        dst = GALLERY_DIR / temp_name
        if src != dst:
            os.rename(src, dst)

    final_names = []
    for idx, temp_name in enumerate(temp_names, start=1):
        final_name = f"gallery-{idx:02d}.jpg"
        final_names.append(final_name)
        src = GALLERY_DIR / temp_name
        dst = GALLERY_DIR / final_name
        if src != dst:
            os.rename(src, dst)

    update_gallery_html(final_names)
    print("Gallery normalization complete.")


if __name__ == "__main__":
    main()
