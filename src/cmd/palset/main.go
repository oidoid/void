// to-do: decide if i want this.
// apply a palette to aseprite files.
// recolor
// asepal
// harmonize
// find src/assets -name \*.aseprite -not -name palette.aseprite|xargs --no-run-if-empty --delimiter=\\n --replace aseprite --batch {} --palette src/assets/atlas/palette.aseprite --save-as {}

package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/oidoid/void/src/cmd/internal/fileutils"
)

func main() {
	argv, err := NewArgv()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	if err := applyPalette(argv); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func applyPalette(argv Argv) error {
	ases, err := fileutils.GlobStarExt(argv.Entries, ".aseprite")
	if err != nil {
		return err
	}
	pal, err := filepath.Abs(argv.Palette)
	if err != nil {
		return err
	}
	for _, ase := range ases {
		abs, err := filepath.Abs(ase)
		if err != nil {
			return err
		}
		if abs == pal {
			continue
		}
		if err := exec.Command(
			"aseprite", "--batch", abs,
			"--palette", pal,
			"--save-as", abs,
		).Run(); err != nil {
			return fmt.Errorf("rasterizing %s: %w", ase, err)
		}
	}
	return nil
}
