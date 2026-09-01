package main

import (
	"errors"
	"flag"
	"fmt"
	"path/filepath"
)

type Argv struct {
	TilesetManifest string   // tileset manifest input path.
	TMXs            []string // TMX files or directories searched recursively.
	Out             string   // generated Go output directory.
	Pkg             string   // generated Go package name derived from Out.
	Watch           bool     // re-pack on TMX, TSX, or tileset manifest changes.
}

func NewArgv() (Argv, error) {
	this := Argv{}
	flag.StringVar(
		&this.TilesetManifest,
		"tileset-manifest",
		"",
		"tileset manifest",
	)
	flag.StringVar(&this.Out, "out", "", "Go output directory")
	flag.BoolVar(&this.Watch, "watch", false, "re-pack on file changes")
	flag.Usage = func() {
		fmt.Fprintf(
			flag.CommandLine.Output(),
			"packboards --tileset-manifest=<file> --out=<dir> "+
				"[--watch] <TMX files…>\n",
		)
		flag.PrintDefaults()
	}
	flag.Parse()
	this.TMXs = flag.Args()
	if len(this.TMXs) == 0 {
		return Argv{}, errors.New("no entry")
	}
	if this.TilesetManifest == "" {
		return Argv{}, errors.New("--tileset-manifest required")
	}
	if this.Out == "" {
		return Argv{}, errors.New("--out required")
	}
	this.Pkg = filepath.Base(filepath.Clean(this.Out))
	return this, nil
}
