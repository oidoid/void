// compiles HTML entrypoints.

package main

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/oidoid/void/src/cmd/pack/cliconfig"
	"github.com/oidoid/void/src/cmd/pack/htmlparser"
	"github.com/oidoid/void/src/cmd/pack/plugins"
)

func main() {
	argv, err := cliconfig.NewArgv()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	config, err := cliconfig.NewCLIConfig(*argv)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	logLevel := api.LogLevelWarning
	if config.WatchPort != 0 {
		logLevel = api.LogLevelInfo
	}

	entryPoints, err := parseEntries(config.Entries)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	opts := api.BuildOptions{
		Bundle:      true,
		Conditions:  config.Conditions,
		EntryNames:  "[name]",
		EntryPoints: entryPoints,
		Format:      api.FormatESModule,
		Loader: map[string]api.Loader{
			".css":  api.LoaderCSS,
			".png":  api.LoaderNone, // just for watching.
			".webp": api.LoaderNone, // "
		},
		LogLevel:          logLevel,
		Metafile:          true,
		MinifyIdentifiers: config.Minify,
		MinifySyntax:      config.Minify,
		MinifyWhitespace:  config.Minify,
		Outdir:            config.OutDir,
		Plugins: []api.Plugin{
			plugins.HTMLPlugin(config),
			plugins.WasmPlugin(config),
		},
		Sourcemap: api.SourceMapLinked,
		Target:    api.ES2024, // https://esbuild.github.io/content-types/#tsconfig-json
		Tsconfig:  config.TsconfigFilename,
		Write:     true, //to-do: false
	}

	if config.WatchPort != 0 {
		opts.Banner = map[string]string{
			"js": "new EventSource('/esbuild').addEventListener('change', () => location.reload())",
		}
		ctx, err := api.Context(opts)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		if err := ctx.Watch(api.WatchOptions{}); err != nil {
			fmt.Fprintln(os.Stderr, err)
			ctx.Dispose()
			os.Exit(1)
		}
		if _, err := ctx.Serve(api.ServeOptions{
			Port: config.WatchPort, Servedir: config.OutDir,
		}); err != nil {
			fmt.Fprintln(os.Stderr, err)
			ctx.Dispose()
			os.Exit(1)
		}
		select {}
	} else {
		result := api.Build(opts)
		if len(result.Errors) > 0 {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		if err := os.WriteFile(
			filepath.Join(config.OutDir, "meta.json"),
			[]byte(result.Metafile),
			0o644,
		); err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
	}
}

func parseEntries(entries []string) ([]string, error) {
	var all []string
	for _, entry := range entries {
		if filepath.Ext(entry) == ".html" {
			htmlEntries, err := parseHTMLEntries(entry)
			if err != nil {
				return nil, err
			}
			all = append(all, htmlEntries...)
		} else {
			all = append(all, entry)
		}
	}
	return all, nil
}

func parseHTMLEntries(filename string) ([]string, error) {
	doc, err := htmlparser.ParseDoc(filename)
	if err != nil {
		return nil, err
	}
	dir := filepath.Dir(filename)
	var entries []string
	for _, node := range htmlparser.QueryTag(doc, "script") {
		src := htmlparser.NodeAttr(node, "src")
		if src != "" && htmlparser.NodeAttr(node, "type") == "module" {
			entries = append(entries, filepath.Join(dir, src))
		}
	}
	for _, node := range htmlparser.QueryTag(doc, "link") {
		if htmlparser.NodeAttr(node, "rel") == "stylesheet" {
			if href := htmlparser.NodeAttr(node, "href"); href != "" {
				entries = append(entries, filepath.Join(dir, href))
			}
		}
	}
	return entries, nil
}
