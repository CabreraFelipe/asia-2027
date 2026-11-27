import io
import subprocess
import tempfile
from pathlib import Path
from PIL import Image, PngImagePlugin
from inspect_document import sanitize, MAX_BYTES


def rejects(mime, data):
    try:
        sanitize(mime, data)
    except Exception:
        return
    raise AssertionError("invalid document accepted")


image = Image.new("RGB", (100, 60), "white")
png = io.BytesIO()
meta = PngImagePlugin.PngInfo()
meta.add_text("private", "synthetic metadata")
image.save(png, "PNG", pnginfo=meta)
m, cleaned = sanitize("image/png", png.getvalue())
assert m == {"safe": True, "mime": "image/png", "pages": 1, "width": 100, "height": 60}
with Image.open(io.BytesIO(cleaned)) as restored:
    assert "private" not in restored.info and restored.size == (100, 60)
jpeg = io.BytesIO()
image.save(jpeg, "JPEG", comment=b"synthetic metadata")
m, cleaned = sanitize("image/jpeg", jpeg.getvalue())
assert m["pages"] == 1 and b"synthetic metadata" not in cleaned
rejects("image/jpeg", png.getvalue())
rejects("image/png", png.getvalue()[:15])
rejects("image/png", b"x" * (MAX_BYTES + 1))
pdf = io.BytesIO()
image.save(pdf, "PDF", save_all=True, append_images=[image], title="synthetic private metadata")
m, cleaned = sanitize("application/pdf", pdf.getvalue())
assert m == {"safe": True, "mime": "application/pdf", "pages": 2}
assert b"synthetic private metadata" not in cleaned
with tempfile.TemporaryDirectory() as root:
    path = Path(root) / "result.pdf"
    path.write_bytes(cleaned)
    info = subprocess.check_output(["pdfinfo", str(path)], text=True)
    assert "Pages:           2" in info
rejects("application/pdf", b"%PDF-1.7 corrupted")
many = io.BytesIO()
image.save(many, "PDF", save_all=True, append_images=[image] * 10)
rejects("application/pdf", many.getvalue())
animated = io.BytesIO()
image.save(animated, "PNG", save_all=True, append_images=[Image.new("RGB", image.size, "red")])
rejects("image/png", animated.getvalue())
print("Document sanitizer: PNG/JPEG, stripped metadata, two-page raster PDF, corrupted and oversized inputs PASS")
