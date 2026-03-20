import fs from 'node:fs/promises'
import path from 'node:path'
import type esbuild from 'esbuild'
import type {Config} from '../types/config.ts'
import {parseHTML} from '../utils/html-parser.ts'

type Manifest = {
  icons?: {src?: string; size?: string; type?: string}[]
  start_url?: string
  version?: string
}

// to-do: a generic utility that recursively inlines all resources in an HTML
//        file.
export function HTMLPlugin(config: Readonly<Config>): esbuild.Plugin {
  return {
    name: 'HTMLPlugin',
    setup(build) {
      build.onEnd(async _result => {
        const doc = await parseHTML(config.entry)

        const scripts = doc.querySelectorAll<HTMLScriptElement>(
          "script[type='module'][src$='.ts']"
        )
        for (const script of scripts) {
          // to-do: test.
          const filename = path.basename(
            script.getAttribute('src')!.replace(/\.ts$/, '.js')
          )
          if (config.oneFile) {
            script.removeAttribute('src')
            script.textContent = await fs.readFile(
              path.join(config.out.dir, filename),
              {encoding: 'utf8'}
            )
          } else script.src = filename
        }

        if (config.oneFile) {
          const imgs = doc.querySelectorAll<HTMLImageElement>('img[src]')
          for (const img of imgs) {
            const filename = img.getAttribute('src')!
            const b64 = await fs.readFile(path.join(config.out.dir, filename), {
              encoding: 'base64'
            })
            const ext = filename.match(/\.([^.]+)$/)?.[1]
            if (!ext) throw Error('no asset extension')
            img.src = `data:image/${ext};base64,${b64}`
          }
        }

        const manifestEl = doc.querySelector<HTMLLinkElement>(
          'link[href][rel="manifest"]'
        )
        if (manifestEl) {
          const manifestFilename = path.resolve(
            path.dirname(config.entry),
            manifestEl.getAttribute('href')!
          )
          const manifest: Manifest = JSON.parse(
            await fs.readFile(manifestFilename, 'utf8')
          )
          if (config.bundle.version) manifest.version = config.bundle.version

          for (const icon of manifest.icons ?? []) {
            if (!icon.src || !icon.type) continue
            const iconFilename = `${path.dirname(manifestFilename)}/${icon.src}`
            const file = await fs.readFile(iconFilename)
            if (config.oneFile)
              icon.src = `data:${icon.type};base64,${file.toString('base64')}`
            else icon.src = path.relative(config.out.dir, iconFilename)
          }
          if (config.watch)
            manifest.start_url = `http://localhost:${config.port}`

          if (config.oneFile)
            manifestEl.href = `data:application/json,${encodeURIComponent(
              JSON.stringify(manifest)
            )}`
          else
            await fs.writeFile(
              path.join(config.out.dir, path.basename(manifestFilename)),
              JSON.stringify(manifest)
            )
        }

        if (config.oneFile) {
          const icons = doc.querySelectorAll<HTMLLinkElement>(
            'link[href][rel="icon"][type]'
          )
          for (const icon of icons) {
            const filename = path.resolve(
              config.out.dir,
              icon.getAttribute('href')!
            )
            const file = await fs.readFile(filename)
            icon.href = `data:${icon.type};base64,${file.toString('base64')}`
          }
        }

        // to-do: test.
        const html = `<!doctype html>\n${doc.documentElement.outerHTML}`
        const outHTMLFilename = path.join(config.out.dir, config.out.filename)
        await fs.writeFile(outHTMLFilename, html)
      })
    }
  }
}
