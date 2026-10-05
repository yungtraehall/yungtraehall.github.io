"""Cache published, unweighted Smogon usage tables for the existing snapshots.

Run after exporting .build/pools.json; unavailable ladders remain unavailable.
"""
import concurrent.futures
import json
import pathlib
import re
import unicodedata
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
CACHE = ROOT / '.build/stats'
CACHE.mkdir(parents=True, exist_ok=True)
POOLS = json.loads((ROOT / '.build/pools.json').read_text())

def read_url(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'PokemonDetails/1.0'})
    return urllib.request.urlopen(request, timeout=25).read().decode('utf-8')

def species_id(name):
    name = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode()
    return re.sub('[^a-z0-9]', '', name.lower())

def fetch_generation(item):
    meta = item['meta']
    generation = meta['generation']
    periods = meta.get('usagePeriods', {})
    default_period = meta.get('usagePeriod') or periods[f'gen{generation}ou']
    indexes = {}
    results = {}
    for tier in ['ZU', 'PU', 'NU', 'RU', 'UU', 'OU', 'Uber', 'AG', 'LC']:
        suffix = {'Uber': 'ubers', 'AG': 'anythinggoes'}.get(tier, tier.lower())
        format_id = f'gen{generation}{suffix}'
        period = periods.get(format_id, default_period)
        url = f'https://www.smogon.com/stats/{period}/{format_id}-0.txt'
        entry = {'period': period, 'format': format_id, 'url': url, 'status': 'unpublished'}
        try:
            if period not in indexes:
                indexes[period] = read_url(f'https://www.smogon.com/stats/{period}/')
            filename = f'{format_id}-0.txt'
            if filename in indexes[period]:
                cache_file = CACHE / f'{period}-{filename}'
                if not cache_file.exists():
                    cache_file.write_text(read_url(url))
                raw = cache_file.read_text()
                rows = {}
                for line in raw.splitlines():
                    cells = [value.strip() for value in line.split('|')]
                    if len(cells) >= 5 and cells[1].isdigit():
                        rows[species_id(cells[2])] = {'rank': int(cells[1]), 'pct': float(cells[3].rstrip('% ').strip())}
                entry.update(status='published', rows=rows)
        except Exception as error:
            entry['status'] = 'unavailable'
            entry['error'] = str(error)
        results[tier] = entry
    print(f'Gen {generation}: ' + ', '.join(tier for tier, entry in results.items() if entry['status'] == 'published'), flush=True)
    return str(generation), results

with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
    manifest = dict(executor.map(fetch_generation, POOLS['generations']))
(CACHE / 'manifest.json').write_text(json.dumps(manifest, separators=(',', ':')))
