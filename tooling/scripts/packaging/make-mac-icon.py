"""Render the existing blue diamond brand with stock Python and macOS icon tools."""
from pathlib import Path
import struct
import subprocess
import tempfile
import zlib

ROOT = Path(__file__).resolve().parents[3]
SIZE = 1024


def chunk(kind, data):
    return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))


with tempfile.TemporaryDirectory(prefix='planner-icon-') as temporary:
    iconset = Path(temporary) / 'planner.iconset'
    iconset.mkdir()
    source = Path(temporary) / 'brand.png'
    rows = bytearray()
    for y in range(SIZE):
        rows.append(0)
        for x in range(SIZE):
            corner_x = max(224 - x, 0, x - 799)
            corner_y = max(224 - y, 0, y - 799)
            inside = 64 <= x <= 959 and 64 <= y <= 959 and corner_x**2 + corner_y**2 <= 160**2
            diamond = abs(x - 512) + abs(y - 512)
            white = 228 <= diamond <= 256 or 130 <= diamond <= 158
            rows.extend((255, 255, 255, 255) if inside and white else (56, 91, 204, 255) if inside else (0, 0, 0, 0))
    source.write_bytes(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', SIZE, SIZE, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b''))
    for size in [16, 32, 128, 256, 512]:
        for scale in [1, 2]:
            suffix = '@2x' if scale == 2 else ''
            target = iconset / f'icon_{size}x{size}{suffix}.png'
            subprocess.run(['sips', '-z', str(size * scale), str(size * scale), str(source), '--out', str(target)], check=True, capture_output=True)
    subprocess.run(['iconutil', '-c', 'icns', str(iconset), '-o', str(ROOT / 'apps/mac/assets/mac-icon.icns')], check=True)
    print('Created apps/mac/assets/mac-icon.icns')
