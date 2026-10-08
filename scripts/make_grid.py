"""Buat grid komposit semua gambar kandidat untuk deteksi watermark via VLM"""
import json
import urllib.request
from PIL import Image, ImageDraw, ImageFont
import io
import os

IMG_DIR = '/home/z/my-project/scripts/img'
os.chdir(IMG_DIR)

data = json.load(open('all_urls.json'))

# Pool gambar produk + kategori (exclude banner, sudah dicek)
pools = ['serum', 'sunscreen', 'moisturizer', 'lipstick', 'foundation', 'palette',
         'shampoo', 'perfume', 'cleanser', 'mask', 'bodylotion', 'tools']

entries = []
for pool in pools:
    for i, url in enumerate(data[pool]):
        entries.append((pool, i, url))

print(f'Total images to check: {len(entries)}')

CELL = 200
COLS = 6
rows = (len(entries) + COLS - 1) // COLS
grid = Image.new('RGB', (COLS * CELL, rows * (CELL + 24)), 'white')
draw = ImageDraw.Draw(grid)
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 16)
except Exception:
    font = ImageFont.load_default()

ok = 0
fail = 0
for idx, (pool, i, url) in enumerate(entries):
    r, c = divmod(idx, COLS)
    label = f'{pool}[{i}]'
    x, y = c * CELL, r * (CELL + 24)
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        img_data = urllib.request.urlopen(req, timeout=15).read()
        img = Image.open(io.BytesIO(img_data)).convert('RGB')
        img.thumbnail((CELL, CELL))
        grid.paste(img, (x + (CELL - img.width) // 2, y + 24 + (CELL - img.height) // 2))
        ok += 1
    except Exception as e:
        fail += 1
        draw.rectangle([x, y + 24, x + CELL, y + 24 + CELL], outline='red', width=2)
    draw.rectangle([x, y + 24, x + CELL, y + 24 + CELL], outline='#999', width=1)
    draw.text((x + 4, y + 2), label, fill='black', font=font)

grid.save('product_grid.png', optimize=True)
print(f'Grid saved: {ok} ok, {fail} failed, size={grid.size}')
