package main

import (
	"errors"
	"flag"
	"fmt"
)

type Argv struct {
	Entries []string
	Palette string
}

func NewArgv() (*Argv, error) {
	this := Argv{}
	flag.StringVar(&this.Palette, "palette", "", "palette .aseprite file")
	flag.Usage = func() {
		fmt.Fprintf(flag.CommandLine.Output(), "palset --palette=<palette.aseprite> <entries…>\n")
		flag.PrintDefaults()
	}
	flag.Parse()
	this.Entries = flag.Args()
	if len(this.Entries) == 0 {
		return nil, errors.New("no entry")
	}
	if this.Palette == "" {
		return nil, errors.New("--palette is required")
	}
	return &this, nil
}
