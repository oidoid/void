package main

import (
	"errors"
	"flag"
	"fmt"
)

type Argv struct {
	ColorMode string
	Entries   []string
	Name      string
	NoWebP    bool
	OutDir    string
	Watch     bool
}

func NewArgv() (*Argv, error) {
	argv := Argv{}
	flag.StringVar(&argv.ColorMode, "color-mode", "indexed", "Aseprite color mode")
	flag.StringVar(&argv.Name, "name", "", "atlas name")
	flag.BoolVar(&argv.NoWebP, "no-webp", false, "skip webp conversion")
	flag.StringVar(&argv.OutDir, "out", "", "output directory")
	flag.BoolVar(&argv.Watch, "watch", false, "re-pack on file changes")
	flag.Usage = func() {
		fmt.Fprintf(flag.CommandLine.Output(), "packatlas --name=<name> --out=<dir> [--color-mode=<mode>] [--no-webp] [--watch] <entries...>\n")
		flag.PrintDefaults()
	}
	flag.Parse()
	argv.Entries = flag.Args()
	if len(argv.Entries) == 0 {
		return nil, errors.New("no entry")
	}
	if argv.Name == "" {
		return nil, errors.New("--name is required")
	}
	if argv.OutDir == "" {
		return nil, errors.New("--out is required")
	}
	return &argv, nil
}
