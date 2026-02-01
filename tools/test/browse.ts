// headed run
// DISPLAY=:99 node tools/test/browse.ts https://superpatience.com
// headless run (change `headless` to true below)
// xvfb-run -a node tools/test/browse.ts https://superpatience.com

import fs from 'node:fs/promises'
import path from 'node:path'
import {chromium} from 'playwright'

const url = process.argv[2] ?? 'https://example.com'
const outDir = 'dist/artifacts'
await fs.mkdir(outDir, {recursive: true})

const browser = await chromium.launch({headless: false})

const page = await browser.newPage()
page.setDefaultNavigationTimeout(45_000)

console.log('goto:', url)
await page.goto(url, {waitUntil: 'domcontentloaded'})

const title = await page.title()
console.log('title:', title)

await new Promise(resolve => setTimeout(resolve, 5000))

const screenshotPath = path.join(outDir, 'page.png')
await page.screenshot({path: screenshotPath, fullPage: true})
console.log('screenshot:', screenshotPath)

await browser.close()
