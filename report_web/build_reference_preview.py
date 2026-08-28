"""Create an isolated, byte-preserving Building_76 report web baseline.

The source HTML and its hundreds of evidence images remain read-only in the
user-provided report archive.  The generated file only adds a ``<base>`` tag
so every original relative image reference continues to resolve correctly.
"""

from __future__ import print_function

import argparse
from pathlib import Path


DEFAULT_SOURCE = Path(r"E:\ai\低空\检测报告\Building_76\Building_76_外墙检测鉴定报告_v2.html")


def build(source, output):
    source = Path(source).resolve()
    output = Path(output).resolve()
    if not source.is_file():
        raise ValueError("Reference report does not exist: {}".format(source))
    text = source.read_text(encoding="utf-8")
    if "class='detail'" not in text or "外墙检测鉴定报告" not in text:
        raise ValueError("Reference report does not have the expected Building_76 structure")
    base_tag = '<base href="{}">'.format(source.parent.as_uri() + "/")
    if "<head>" not in text:
        raise ValueError("Reference report has no head element")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(text.replace("<head>", "<head>\n" + base_tag, 1), encoding="utf-8")
    print("generated {} ({} defect pages)".format(output, text.count("class='detail'")))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default=str(DEFAULT_SOURCE))
    parser.add_argument("--output", default=str(Path(__file__).resolve().parent / "building_76_reference.html"))
    args = parser.parse_args()
    build(args.source, args.output)

