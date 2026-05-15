// pack a sprite atlas.

package main

import (
	"encoding/json"
	"fmt"
	"go/format"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"unicode"

	"github.com/fsnotify/fsnotify"
	"github.com/oidoid/void/src/cmd/internal/fileutils"
	"github.com/oidoid/void/src/void/vatlas"
)

func main() {
	argv, err := NewArgv()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	if err := packAtlas(argv); err != nil {
		fmt.Fprintln(os.Stderr, err)
		if !argv.Watch {
			os.Exit(1)
		}
	}

	if argv.Watch {
		if err := watch(argv); err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
	}
}

func watch(argv *Argv) error {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}
	defer watcher.Close()
	for _, entry := range argv.Entries {
		if err := watcher.Add(entry); err != nil {
			return err
		}
	}
	for {
		select {
		case event, ok := <-watcher.Events:
			if !ok {
				return nil
			}
			if filepath.Ext(event.Name) == ".aseprite" {
				if err := packAtlas(argv); err != nil {
					fmt.Fprintln(os.Stderr, err)
				}
			}
		case err, ok := <-watcher.Errors:
			if !ok {
				return nil
			}
			fmt.Fprintln(os.Stderr, err)
		}
	}
}

func packAtlas(argv *Argv) error {
	ases, err := fileutils.GlobStarExt(argv.Entries, ".aseprite")
	if err != nil {
		return err
	}
	sheet := filepath.Join(argv.ImgOut, argv.Name+".png")
	args := []string{
		"--batch",
		"--color-mode=" + argv.ColorMode,
		"--filename-format={title}--{tag}--{frame}", // to-do: still relevant?
		"--list-slices",
		"--list-tags",
		"--merge-duplicates",
		// to-do: "--power-of-two-size",
		"--sheet=" + sheet,
		"--sheet-pack",
		"--tagname-format={title}--{tag}", // to-do: still relevant?
	}
	args = append(args, ases...)
	jsonBytes, err := exec.Command("aseprite", args...).Output()
	if err != nil {
		return fmt.Errorf("aseprite failed: %w", err)
	}
	if err := pngToWebP(sheet, filepath.Join(argv.ImgOut, argv.Name+".webp")); err != nil {
		return fmt.Errorf("cwebp failed: %w", err)
	}
	var aseData vatlas.AseFile
	if err := json.Unmarshal(jsonBytes, &aseData); err != nil {
		return fmt.Errorf("parse aseprite json: %w", err)
	}
	atlas, tags, err := parseAtlas(&aseData)
	if err != nil {
		return err
	}
	atlasBin := vatlas.EncodeAtlas(atlas)
	dataSrc, err := genData(argv.Pkg, atlasBin)
	if err != nil {
		return err
	}
	if err := os.WriteFile(filepath.Join(argv.CodeOut, argv.Name+"_bin.go"), dataSrc, 0o644); err != nil {
		return err
	}
	idsSrc, err := genIDs(argv.Pkg, tags)
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(argv.CodeOut, argv.Name+"_ids.go"), idsSrc, 0o644)
}

func genData(pkg string, data []byte) ([]byte, error) {
	var str strings.Builder
	fmt.Fprintf(&str, "// codegen by packsprites.\npackage %s\n\nvar AtlasBin = []byte{", pkg)
	for i, v := range data {
		if i%16 == 0 {
			str.WriteString("\n\t")
		}
		fmt.Fprintf(&str, "0x%02x,", v)
	}
	str.WriteString("\n}\n")
	return format.Source([]byte(str.String()))
}

func genIDs(pkg string, tags []string) ([]byte, error) {
	var str strings.Builder
	fmt.Fprintf(&str, "// codegen by packsprites.\npackage %s\n\n// identifies an animation in an Atlas.\ntype AnimID uint16\n\nconst (\n", pkg)
	for i, tag := range tags {
		if i == 0 {
			fmt.Fprintf(&str, "\t%s AnimID = iota\n", tagToIdent(tag))
		} else {
			fmt.Fprintf(&str, "\t%s\n", tagToIdent(tag))
		}
	}
	fmt.Fprintf(&str, ")\n")
	return format.Source([]byte(str.String()))
}

// converts a tag like "backpacker--Idle" or "mem-prop-5x6--Blink" into a Go
// identifier like "BackpackerIdle" or "MemProp5x6Blink".
func tagToIdent(tag string) string {
	var str strings.Builder
	for _, seg := range strings.Split(tag, "-") {
		if seg == "" {
			continue
		}
		chars := []rune(seg)
		str.WriteRune(unicode.ToUpper(chars[0]))
		str.WriteString(string(chars[1:]))
	}
	return str.String()
}

func pngToWebP(src, dst string) error {
	return exec.Command(
		"cwebp", "-exact", "-lossless", "-mt", "-quiet", "-z", "9", src, "-o", dst,
	).Run()
}
