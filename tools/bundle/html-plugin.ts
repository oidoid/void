import fs from 'node:fs/promises'
import path from 'node:path'
import type esbuild from 'esbuild'
import {minify} from 'html-minifier-next'
import type {ConfigFile} from '../../schema/config-file.ts'
import type {Argv} from '../utils/argv.ts'
import {exec} from '../utils/exec.ts'
import {parseHTML} from '../utils/html-parser.ts'

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

        await fs.writeFile(
          // to-do: test.
          path.join(config.out, path.basename(config.entry)),
          html
        )
      })
    }
  }
}
