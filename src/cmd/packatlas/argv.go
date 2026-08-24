package main

import (
	"errors"
	"flag"
	"fmt"
)

type Argv struct {
	ColorMode          string
	Entries            []string
	Name               string
	ImgOut             string
	AtlasOut           string
	TagsOut            string
	TilesetManifestOut string
	Watch              bool
}

func NewArgv() (Argv, error) {
	this := Argv{}
	flag.StringVar(&this.ColorMode, "color-mode", "indexed", "Aseprite color mode")
	flag.StringVar(&this.Name, "name", "", "atlas name")
	flag.StringVar(&this.ImgOut, "img-out", "", "image output directory")
	flag.StringVar(&this.AtlasOut, "atlas-out", "", "atlas Go output file")
	flag.StringVar(&this.TagsOut, "tags-out", "", "tags Go output file")
	flag.StringVar(
		&this.TilesetManifestOut,
		"tileset-manifest-out",
		"",
		"tileset manifest output file",
	)
	flag.BoolVar(&this.Watch, "watch", false, "re-pack on file changes")
	flag.Usage = func() {
		fmt.Fprintf(
			flag.CommandLine.Output(),
			"packatlas --name=<name> --img-out=<dir> "+
				"--atlas-out=<file> --tags-out=<file> "+
				"[--tileset-manifest-out=<file>] "+
				"[--color-mode=<mode>] [--watch] <entries…>\n",
		)
		flag.PrintDefaults()
	}
	flag.Parse()
	this.Entries = flag.Args()
	if len(this.Entries) == 0 {
		return Argv{}, errors.New("no entry")
	}
	if this.Name == "" {
		return Argv{}, errors.New("--name required")
	}
	if this.ImgOut == "" {
		return Argv{}, errors.New("--img-out required")
	}
	if this.AtlasOut == "" {
		return Argv{}, errors.New("--atlas-out required")
	}
	if this.TagsOut == "" {
		return Argv{}, errors.New("--tags-out required")
	}

	return this, nil
}
