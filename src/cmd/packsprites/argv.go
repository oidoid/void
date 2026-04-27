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
	this := Argv{}
	flag.StringVar(&this.ColorMode, "color-mode", "indexed", "Aseprite color mode")
	flag.StringVar(&this.Name, "name", "", "atlas name")
	flag.BoolVar(&this.NoWebP, "no-webp", false, "skip webp conversion")
	flag.StringVar(&this.OutDir, "out", "", "output directory")
	flag.BoolVar(&this.Watch, "watch", false, "re-pack on file changes")
	flag.Usage = func() {
		fmt.Fprintf(flag.CommandLine.Output(), "packatlas --name=<name> --out=<dir> [--color-mode=<mode>] [--no-webp] [--watch] <entries…>\n")
		flag.PrintDefaults()
	}
	flag.Parse()
	this.Entries = flag.Args()
	if len(this.Entries) == 0 {
		return nil, errors.New("no entry")
	}
	if this.Name == "" {
		return nil, errors.New("--name is required")
	}
	if this.OutDir == "" {
		return nil, errors.New("--out is required")
	}
	return &this, nil
}
