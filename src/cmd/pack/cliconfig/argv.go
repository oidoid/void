package cliconfig

import (
	"errors"
	"flag"
	"fmt"
)

type Argv struct {
	Entry            string
	Minify           bool
	OneFile          bool
	OutDir           string
	TsconfigFilename string
	Watch            watchFlag
}

func NewArgv() (*Argv, error) {
	argv := Argv{}
	flag.StringVar(&argv.Entry, "entry", "", "path to HTML entry file")
	flag.BoolVar(&argv.Minify, "minify", false, "minify output")
	flag.BoolVar(&argv.OneFile, "one-file", false, "inline everything into a single HTML file")
	flag.StringVar(&argv.OutDir, "out", "dist/", "output dir")
	flag.StringVar(&argv.TsconfigFilename, "tsconfig", "tsconfig.json", "path to tsconfig file")
	flag.Var(&argv.Watch, "watch", "live reload on http://localhost:port (default port 1234)")
	flag.Usage = func() {
		fmt.Fprintf(flag.CommandLine.Output(), "pack --entry=<file> [--minify] [--one-file] [--out=<dir>] [--tsconfig=<file>] [--watch[=port]]\n")
		flag.PrintDefaults()
	}
	flag.Parse()
	if argv.Entry == "" {
		return nil, errors.New("--entry is required")
	}
	return &argv, nil
}
