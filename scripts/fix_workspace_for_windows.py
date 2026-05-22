import pathlib
import sys

p = pathlib.Path('pnpm-workspace.yaml')
lines = p.read_text().splitlines()
before = len(lines)
lines = [l for l in lines if 'win32' not in l and 'win64' not in l]
p.write_text('\n'.join(lines) + '\n')
removed = before - len(lines)
print('Removed', removed, 'Windows exclusion lines from pnpm-workspace.yaml')
if removed == 0:
    print('WARNING: no lines were removed -- check the file manually')
    sys.exit(1)
