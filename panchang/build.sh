#!/bin/sh
set -e
cd "$(dirname "$0")"
ESB=/home/claude/.npm-global/lib/node_modules/tsx/node_modules/esbuild/bin/esbuild
mkdir -p dist
$ESB ui/app.js --bundle --minify --format=iife --target=es2019 --outfile=dist/app.js --log-level=warning
python3 - <<'PY'
css=open('ui/style.css').read(); js=open('dist/app.js').read().replace('</script','<\\/script')
html=open('ui/index.template.html').read().replace('/*__CSS__*/',css).replace('/*__JS__*/',js)
open('dist/panchang.html','w').write(html)
print('built', len(html)//1024, 'KB')
PY
