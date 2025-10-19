import fs from 'node:fs/promises'
import path from 'node:path'
import type esbuild from 'esbuild'
import {minify} from 'html-minifier-next'
import type {ConfigFile} from '../../schema/config-file.ts'
import type {Argv} from '../utils/argv.ts'
import {exec} from '../utils/exec.ts'
import {parseHTML} from '../utils/html-parser.ts'

type Manifest = {
  icons?:
    | {
        src?: string | undefined
        size?: string | undefined
        type?: string | undefined
      }[]
    | undefined
  start_url?: string | undefined
  version?: string | undefined
}

export function HTMLPlugin(
  argv: Readonly<Argv>,
  config: Readonly<ConfigFile>
): esbuild.Plugin {
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
          if (argv.opts['--one-file']) {
            script.removeAttribute('src')
            script.textContent = await fs.readFile(
              path.join(config.out, filename),
              {encoding: 'utf8'}
            )
          } else script.src = filename
        }

        if (argv.opts['--one-file']) {
          const imgs = doc.querySelectorAll<HTMLImageElement>(
            "img#preload-atlas[src$='.png']"
          ) // to-do: multi-atlas support.
          for (const img of imgs) {
            const filename = img.getAttribute('src')!
            const b64 = await fs.readFile(path.join(config.out, filename), {
              encoding: 'base64'
            })
            img.src = `data:image/png;base64,${b64}`
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
          if (process.env.npm_package_version)
            manifest.version = process.env.npm_package_version

          for (const icon of manifest.icons ?? []) {
            if (!icon.src || !icon.type) continue
            const iconFilename = `${path.dirname(manifestFilename)}/${icon.src}`
            const file = await fs.readFile(iconFilename)
            if (argv.opts['--one-file'])
              icon.src = `data:${icon.type};base64,${file.toString('base64')}`
            else icon.src = path.relative(config.out, iconFilename)
          }
          if (argv.opts['--watch']) manifest.start_url = 'http://localhost:1234'

          if (argv.opts['--one-file'])
            manifestEl.href = `data:application/json,${encodeURIComponent(
              JSON.stringify(manifest)
            )}`
          else
            await fs.writeFile(
              path.join(config.out, path.basename(manifestFilename)),
              JSON.stringify(manifest)
            )
        }

        if (argv.opts['--one-file']) {
          const icons = doc.querySelectorAll<HTMLLinkElement>(
            'link[href][rel="icon"][type]'
          )
          for (const icon of icons) {
            const filename = path.resolve(
              config.out,
              icon.getAttribute('href')!
            )
            const file = await fs.readFile(filename)
            icon.href = `data:${icon.type};base64,${file.toString('base64')}`
          }
        }

        let html = `<!doctype html>\n${doc.documentElement.outerHTML}`

        if (argv.opts['--minify'])
          html = await minify(html, {
            caseSensitive: true,
            collapseBooleanAttributes: true,
            html5: true,
            minifyCSS: true,
            removeAttributeQuotes: true,
            removeComments: true,
            removeEmptyAttributes: true
          })
        // to-do: what biome config does this use outside of the repo?
        else
          html = await exec(
            'biome',
            'check',
            '--fix',
            `--stdin-file-path=${config.entry}`,
            {stdin: html}
          )

        let suffix = '.html'
        if (!argv.opts['--watch'] && process.env.npm_package_version)
          suffix = `-v${process.env.npm_package_version}.html`
        // to-do: test.
        const outHTMLFilename = `${path.join(config.out, path.basename(config.entry, '.html'))}${suffix}`
        await fs.writeFile(outHTMLFilename, html)
      })
    }
  }
}
