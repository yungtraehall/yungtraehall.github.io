"""Download official species tables at the revision used for this update."""
from pathlib import Path
from urllib.request import urlopen

REVISION = '9fb3a5b99f1a0bea17f495c5cc1bfe04fdd19c3e'
ROOT = Path(__file__).resolve().parents[1] / '.build/showdown'
files = ['data/pokedex.ts', 'data/abilities.ts', 'data/formats-data.ts']
files += [f'data/mods/gen{generation}/{name}.ts' for generation in range(1, 9)
          for name in ['pokedex', 'formats-data'] if not (generation == 3 and name == 'pokedex')]
for name in files:
    destination = ROOT / name
    destination.parent.mkdir(parents=True, exist_ok=True)
    url = f'https://raw.githubusercontent.com/smogon/pokemon-showdown/{REVISION}/{name}'
    destination.write_bytes(urlopen(url, timeout=30).read())
    print(name, flush=True)
