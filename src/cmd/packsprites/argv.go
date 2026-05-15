package main

import (
	"errors"
	"flag"
	"fmt"
	"path/filepath"
)

type Argv struct {
	ColorMode string
	Entries   []string
	Name      string
	ImgOut    string
	Pkg       string
	CodeOut   string
	Watch     bool
}

func NewArgv() (*Argv, error) {
	this := Argv{}
	flag.StringVar(&this.ColorMode, "color-mode", "indexed", "Aseprite color mode")
	flag.StringVar(&this.Name, "name", "", "atlas name")
	flag.StringVar(&this.ImgOut, "img-out", "", "image output directory")
	flag.StringVar(&this.CodeOut, "code-out", "", "gencode output directory")
	flag.BoolVar(&this.Watch, "watch", false, "re-pack on file changes")
	flag.Usage = func() {
		fmt.Fprintf(flag.CommandLine.Output(), "packatlas --name=<name> --img-out=<dir> [--color-mode=<mode>] [--watch] <entries…>\n")
		flag.PrintDefaults()
	}
	flag.Parse()
	this.Entries = flag.Args()
	if len(this.Entries) == 0 {
		return nil, errors.New("no entry")
	}
	if this.Name == "" {
		return nil, errors.New("--name required")
	}
	if this.ImgOut == "" {
		return nil, errors.New("--img-out required")
	}
	this.Pkg = filepath.Base(this.CodeOut)

	return &this, nil
}
