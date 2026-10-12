import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':420,'height':900})
        errs=[]; reqs=[]
        pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERR '+str(e)))
        pg.on('request', lambda r: reqs.append(r.url) if not r.url.startswith('file:') and not r.url.startswith('data:') else None)
        await pg.goto('file:///home/claude/build/dist/panchang.html')
        await pg.wait_for_selector('main')
        await pg.screenshot(path='/tmp/s_today.png', full_page=True)
        print('TODAY text:', (await pg.inner_text('main'))[:600].replace('\n',' | '))
        labels=['calendar','muhurat','festivals','planets','kundali']
        btns = pg.locator('.botnav button')
        for i,l in enumerate(labels, start=1):
            await btns.nth(i).click()
            await pg.wait_for_timeout(400)
            await pg.screenshot(path=f'/tmp/s_{l}.png', full_page=True)
            print(l.upper(), 'chars', len(await pg.inner_text('main')))
        print('ERRORS:', errs); print('EXTERNAL REQUESTS:', reqs)
        await b.close()
asyncio.run(main())
