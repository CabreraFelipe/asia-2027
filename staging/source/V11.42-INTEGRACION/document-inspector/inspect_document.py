"""One-shot sanitizer. Run ONLY in an isolated, resource-limited process with no network."""
import argparse
import io
import json
import os
import re
import subprocess
import sys
import tempfile
import warnings
from pathlib import Path

from PIL import Image, ImageOps, ImageFile

MAX_BYTES = 10 * 1024 * 1024
MAX_PIXELS = 20_000_000
MAX_PAGES = 10
Image.MAX_IMAGE_PIXELS = MAX_PIXELS
ImageFile.LOAD_TRUNCATED_IMAGES = False
warnings.simplefilter("error", Image.DecompressionBombWarning)


def require(condition):
    if not condition:
        raise ValueError("invalid document")


def clean_image(source, expected):
    with Image.open(source, formats=[expected]) as image:
        require(image.format == expected and getattr(image, "n_frames", 1) == 1)
        require(0 < image.width * image.height <= MAX_PIXELS)
        image.load()
        image = ImageOps.exif_transpose(image)
        require(0 < image.width * image.height <= MAX_PIXELS)
        rgba = image.convert("RGBA")
        result = Image.new("RGB", rgba.size, "white")
        result.paste(rgba, mask=rgba.getchannel("A"))
        return result


def run(args, seconds):
    result = subprocess.run(args, stdin=subprocess.DEVNULL, stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE, timeout=seconds, check=False,
                            env={"PATH": "/usr/bin:/bin", "LANG": "C", "LC_ALL": "C"},
                            cwd="/tmp")
    require(result.returncode == 0 and not result.stderr.strip())
    return result.stdout.decode("utf-8", errors="strict")


def sanitize(mime, data):
    require(8 <= len(data) <= MAX_BYTES)
    if mime in ("image/jpeg", "image/png"):
        fmt = "JPEG" if mime == "image/jpeg" else "PNG"
        with clean_image(io.BytesIO(data), fmt) as image:
            width, height = image.size
            out = io.BytesIO()
            if fmt == "JPEG":
                image.save(out, format=fmt, quality=92)
            else:
                image.save(out, format=fmt)
            clean = out.getvalue()
        metadata = {"safe": True, "mime": mime, "pages": 1, "width": width, "height": height}
    elif mime == "application/pdf":
        require(data.startswith(b"%PDF-"))
        with tempfile.TemporaryDirectory(dir="/tmp") as tmp:
            root = Path(tmp)
            source = root / "input.pdf"
            source.write_bytes(data)
            info = run(["pdfinfo", str(source)], 4)
            pages = re.search(r"^Pages:\s+([0-9]+)\s*$", info, re.M)
            require(pages is not None and 1 <= int(pages.group(1)) <= MAX_PAGES)
            count = int(pages.group(1))
            require(re.search(r"^Encrypted:\s+no\s*$", info, re.M) is not None)
            require(re.search(r"^JavaScript:\s+no\s*$", info, re.M) is not None)
            run(["pdftoppm", "-f", "1", "-l", str(count), "-scale-to", "2200",
                 "-png", str(source), str(root / "page")], 12)
            files = sorted(root.glob("page-*.png"), key=lambda f: int(f.stem.split("-")[-1]))
            require(len(files) == count and sum(f.stat().st_size for f in files) <= 40 * 1024 * 1024)
            images = []
            try:
                for file in files:
                    images.append(clean_image(file, "PNG"))
                out = io.BytesIO()
                images[0].save(out, format="PDF", save_all=True,
                               append_images=images[1:], resolution=180, quality=88,
                               title="", author="", subject="", creator="", producer="")
                clean = out.getvalue()
            finally:
                for image in images:
                    image.close()
        metadata = {"safe": True, "mime": mime, "pages": count}
    else:
        raise ValueError("invalid format")
    require(8 <= len(clean) <= MAX_BYTES)
    return metadata, clean


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mime", required=True, choices=["application/pdf", "image/jpeg", "image/png"])
    args = parser.parse_args()
    try:
        raw = sys.stdin.buffer.read(MAX_BYTES + 1)
        meta, clean = sanitize(args.mime, raw)
        # One JSON line followed by raw bytes; nothing else on stdout.
        sys.stdout.buffer.write(json.dumps({**meta, "size": len(clean)}, separators=(",", ":")).encode() + b"\n")
        sys.stdout.buffer.write(clean)
        sys.stdout.buffer.flush()
    except Exception:
        # Never log the filename, file contents, metadata, parser diagnostics, or exception.
        print("Document rejected", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
