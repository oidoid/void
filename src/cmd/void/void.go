// compiles images into an atlas and bundles an HTML entrypoint.

package main

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/oidoid/void/src/cmd/void/cliconfig"
	"github.com/oidoid/void/src/cmd/void/htmlparser"
	"github.com/oidoid/void/src/cmd/void/plugins"
)

func main() {
	argv := cliconfig.NewArgv()

	cfg, err := cliconfig.NewCLIConfig(argv)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	logLevel := api.LogLevelWarning
	if cfg.WatchPort != 0 {
		logLevel = api.LogLevelInfo
	}

	entryPoints, err := parseEntrypoints(cfg.Entry)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	opts := api.BuildOptions{
		Bundle:            true,
		Conditions:        cfg.Conditions,
		EntryNames:        "[name]",
		EntryPoints:       entryPoints,
		Format:            api.FormatESModule,
		Loader:            map[string]api.Loader{".css": api.LoaderCSS},
		LogLevel:          logLevel,
		Metafile:          true,
		MinifyIdentifiers: cfg.Minify,
		MinifySyntax:      cfg.Minify,
		MinifyWhitespace:  cfg.Minify,
		Outdir:            cfg.OutDir,
		Plugins:           []api.Plugin{plugins.HTMLPlugin(cfg), plugins.WasmPlugin(cfg)},
		Sourcemap:         api.SourceMapLinked,
		Target:            api.ES2024, // // https://esbuild.github.io/content-types/#tsconfig-json
		Tsconfig:          cfg.TsconfigFilename,
		Write:             true, //to-do: false
	}

	if cfg.WatchPort != 0 {
		opts.Banner = map[string]string{
			"js": "new EventSource('/esbuild').addEventListener('change', () => location.reload())",
		}
		ctx, err := api.Context(opts)
		if err != nil {
			os.Exit(1)
		}
		if err := ctx.Watch(api.WatchOptions{}); err != nil {
			ctx.Dispose()
			os.Exit(1)
		}
		if _, err := ctx.Serve(api.ServeOptions{Port: cfg.WatchPort, Servedir: cfg.OutDir}); err != nil {
			ctx.Dispose()
			os.Exit(1)
		}
		select {}
	} else {
		result := api.Build(opts)
		if len(result.Errors) > 0 {
			os.Exit(1)
		}
		if cfg.MetaFilename != "" {
			if err := os.WriteFile(cfg.MetaFilename, []byte(result.Metafile), 0o644); err != nil {
				fmt.Fprintln(os.Stderr, err)
				os.Exit(1)
			}
		}
	}
}

func parseEntrypoints(filename string) ([]string, error) {
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
