import re
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

root = Path(r"D:\SWD\UNI-MATE")
source_path = root / "docs" / "auth-uml-sequence-diagrams.md"
out_dir = root / ".codex-tmp" / "auth-diagrams" / "rendered"
out_dir.mkdir(parents=True, exist_ok=True)

text = source_path.read_text(encoding="utf-8")
blocks = re.findall(r"```mermaid\s*\n(.*?)\n```", text, flags=re.S)
if len(blocks) != 3:
    raise SystemExit(f"Expected 3 Mermaid blocks, found {len(blocks)}")

for index, diagram in enumerate(blocks, start=1):
    request = Request(
        "https://kroki.io/mermaid/svg",
        data=diagram.encode("utf-8"),
        headers={"Content-Type": "text/plain", "User-Agent": "UNI-MATE-Mermaid-Validator/1.0"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=180) as response:
            rendered = response.read()
    except HTTPError as exc:
        print(f"diagram {index} failed: {exc.read().decode('utf-8', errors='replace')}")
        raise
    target = out_dir / f"auth-sequence-{index}.svg"
    target.write_bytes(rendered)
    print(f"validated {index}: {target.name} ({len(rendered)} bytes)")
