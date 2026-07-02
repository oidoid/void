package cliconfig

import (
	"errors"
	"flag"
	"fmt"
)

type Argv struct {
	Entries          []string
	Minify           bool
	OneFile          bool
	OutDir           string
	TsconfigFilename string
	Watch            watchFlag
}

func NewArgv() (Argv, error) {
	this := Argv{}
	flag.BoolVar(&this.Minify, "minify", false, "minify output")
	flag.BoolVar(
		&this.OneFile,
		"one-file",
		false,
		"inline everything into a single HTML file",
	)
	flag.StringVar(&this.OutDir, "out", "dist/", "output dir")
	flag.StringVar(
		&this.TsconfigFilename,
		"tsconfig",
		"tsconfig.json",
		"path to tsconfig file",
	)
	flag.Var(
		&this.Watch,
		"watch",
		"live reload on http://localhost:port (default port 1234)",
	)
	flag.Usage = func() {
		fmt.Fprintf(
			flag.CommandLine.Output(),
			"pack [--minify] [--one-file] [--out=<dir>] [--tsconfig=<file>] [--watch[=port]] <entry…>\n",
		)
		flag.PrintDefaults()
	}
	flag.Parse()
	this.Entries = flag.Args()
	if len(this.Entries) == 0 {
		return Argv{}, errors.New("no entry")
	}
	return this, nil
}
