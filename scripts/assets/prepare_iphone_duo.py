"""Download + prepare Apple's iPhone Duo AR reference model for the fold scene.

Adapted from jadon7/iphone-duo `scripts/prepare-assets.py` (MIT). The model and textures belong
to Apple and are NOT part of this repository (output dir is gitignored); their use is subject to
Apple's terms — local demo use only.
Usage: .venv-tools/bin/python -I scripts/assets/prepare_iphone_duo.py
"""
from pathlib import Path
from urllib.request import urlretrieve
from zipfile import ZipFile

from pxr import Sdf, Usd

ROOT = Path(__file__).resolve().parents[2]
assets = ROOT / "public/sites/roco-bank/iphone-duo"
textures = assets / "textures"
textures.mkdir(parents=True, exist_ok=True)
model = assets / "iPhone_Duo_Star_White.usdz"
url = "https://www.apple.com/105/media/us/iphone-duo/2026/9305e4b9-72d9-4c05-9381-b572adadd5e5/ar/iPhone_Duo_e-sim_Star-White_Variant.usdz"
if not model.exists():
    print("Downloading the Apple reference model...", flush=True)
    urlretrieve(url, model)
with ZipFile(model) as archive:
    for name in archive.namelist():
        if Path(name).suffix.lower() in {".png", ".jpg", ".jpeg", ".avif"}:
            (textures / Path(name).name).write_bytes(archive.read(name))
stage = Usd.Stage.Open(str(model))
stage.GetDefaultPrim().GetVariantSet("Pose").SetVariantSelection("Landscape")
flat = Usd.Stage.Open(stage.Flatten())
for prim in flat.Traverse():
    for attribute in prim.GetAttributes():
        value = attribute.Get()
        if isinstance(value, Sdf.AssetPath) and value.path:
            filename = Path(value.path.split("[")[-1].rstrip("]")).name
            attribute.Set(Sdf.AssetPath(f"textures/{filename}"))
flat.GetRootLayer().Export(str(assets / "iPhone_Duo_Render.usdc"))
model.unlink()  # keep only what the browser loads
print("ready:", sorted(p.name for p in assets.iterdir()))
