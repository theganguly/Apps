import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={'width':1100,'height':900})
        errs=[]
        pg.on('console', lambda m: errs.append(m.text) if m.type=='error' else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERR '+str(e)))
        await pg.goto('file:///home/claude/build/dist/panchang.html'); await pg.wait_for_selector('main')
        # language -> English
        await pg.click('.btn-lang'); await pg.wait_for_timeout(200)
        print('EN today:', (await pg.inner_text('main'))[:330].replace('\n',' | '))
        await pg.screenshot(path='/tmp/d_today_en.png')
        # prev/next day then back
        await pg.click('.navrow .navbtn >> nth=1'); await pg.wait_for_timeout(200)
        print('next day heading:', await pg.inner_text('.masthead h1'))
        await pg.click('.todaybtn'); 
        # muhurat tab, next day stays in tab
        await pg.click('.topnav button >> nth=2'); await pg.wait_for_timeout(200)
        await pg.click('.navrow .navbtn >> nth=1'); await pg.wait_for_timeout(200)
        print('muhurat tab active after next:', await pg.inner_text('.topnav button.on'))
        await pg.click('text=Show'); await pg.wait_for_timeout(100)
        print('hora items:', await pg.locator('.horai').count())
        await pg.screenshot(path='/tmp/d_muhurat_en.png', full_page=True)
        # calendar next month
        await pg.click('.topnav button >> nth=1'); await pg.click('.navrow .navbtn >> nth=1'); await pg.wait_for_timeout(300)
        print('cal title:', await pg.inner_text('.cal-title'))
        await pg.screenshot(path='/tmp/d_cal_en.png', full_page=True)
        # festivals
        await pg.click('.topnav button >> nth=3'); await pg.wait_for_timeout(500)
        print('FEST:', (await pg.inner_text('main'))[:900].replace('\n',' | '))
        ecl = await pg.locator('.ecl').all_inner_texts(); print('ECL:', [e.replace('\n',' ') for e in ecl])
        await pg.screenshot(path='/tmp/d_fest_en.png', full_page=True)
        # planets
        await pg.click('.topnav button >> nth=4'); await pg.wait_for_timeout(500)
        await pg.click('.rbtn >> nth=3'); await pg.wait_for_timeout(100)
        print('PLANETS:', (await pg.inner_text('main'))[:1100].replace('\n',' | '))
        await pg.screenshot(path='/tmp/d_planets_en.png', full_page=True)
        # kundali
        await pg.click('.topnav button >> nth=5'); await pg.click('.castbtn'); await pg.wait_for_timeout(500)
        await pg.click('.dasha >> nth=1 >> button'); await pg.wait_for_timeout(100)
        print('KUNDALI:', (await pg.inner_text('main'))[:700].replace('\n',' | '))
        await pg.screenshot(path='/tmp/d_kundali_en.png', full_page=True)
        # persistence of settings
        await pg.reload(); await pg.wait_for_selector('main')
        print('after reload lang btn:', await pg.inner_text('.btn-lang'))
        print('ERRORS', errs)
        await b.close()
asyncio.run(main())
