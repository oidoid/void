// generates a Go Font literal from JSON.

package main

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"go/format"
	"os"
	"path/filepath"
	"strings"
	templ "text/template"

	"github.com/oidoid/void/src/void/vtext"
)

//go:embed font.gotmpl
var fontTemplSrc string

var fontTempl = templ.Must(templ.New(
	"font.gotmpl",
).Parse(fontTemplSrc))

type fontJSON struct {
	ID                       string          `json:"id"`
	Name                     string          `json:"name"`
	CellW                    int             `json:"cellW"`
	CellH                    int             `json:"cellH"`
	Leading                  int             `json:"leading"`
	LineH                    int             `json:"lineH"`
	Baseline                 int             `json:"baseline"`
	Kerning                  map[string]int  `json:"kerning"`
	DefaultKerning           int             `json:"defaultKerning"`
	DefaultWhitespaceKerning int             `json:"defaultWhitespaceKerning"`
	EndOfLineKerning         int             `json:"endOfLineKerning"`
	CharW                    map[string]int  `json:"charW"`
	DefaultCharW             int             `json:"defaultCharW"`
	Descends                 map[string]bool `json:"descends"`
}

func main() {
	if len(os.Args) != 3 {
		fmt.Fprintln(os.Stderr, "usage: genfont <font.json> <out.go>")
		os.Exit(1)
	}
	if err := run(os.Args[1], os.Args[2]); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run(in, out string) error {
	bin, err := os.ReadFile(in)
	if err != nil {
		return fmt.Errorf("reading font JSON: %w", err)
	}

	var font fontJSON
	if err := json.Unmarshal(bin, &font); err != nil {
		return fmt.Errorf("parsing font JSON %s: %w", in, err)
	}

	absOut, err := filepath.Abs(out)
	if err != nil {
		return fmt.Errorf("resolving font codegen output path: %w", err)
	}
	pkg := filepath.Base(filepath.Dir(absOut))

	templData := struct {
		Pkg      string
		VarName  string
		Font     *fontJSON
		Kerning  []byte
		Widths   []byte
		Descends []byte
	}{
		pkg,
		shishKebabToTitleCase(font.ID),
		&font,
		vtext.EncodeKerning(
			font.Kerning,
			font.DefaultKerning,
			font.DefaultWhitespaceKerning,
		),
		vtext.EncodeWidths(font.CharW, font.DefaultCharW),
		vtext.EncodeDescends(font.Descends),
	}
	var str strings.Builder
	if err := fontTempl.Execute(&str, &templData); err != nil {
		return fmt.Errorf("executing font template: %w", err)
	}

	src, err := format.Source([]byte(str.String()))
	if err != nil {
		return fmt.Errorf("format: %w", err)
	}
	if err := os.WriteFile(out, src, 0o666); err != nil {
		return err
	}
	return nil
}

func shishKebabToTitleCase(str string) string {
	var pascal strings.Builder
	upper := true
	for _, rune := range str {
		if rune == '-' {
			upper = true
			continue
		}
		if upper {
			if rune >= 'a' && rune <= 'z' {
				rune -= 'a' - 'A'
			}
			upper = false
		}
		pascal.WriteRune(rune)
	}
	return pascal.String()
}
