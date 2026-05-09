// generates a Go Font literal from JSON.

package main

import (
	"encoding/json"
	"fmt"
	"go/format"
	"os"
	"path/filepath"
	"strings"
)

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
		return err
	}

	var font fontJSON
	if err := json.Unmarshal(bin, &font); err != nil {
		return err
	}

	absOut, err := filepath.Abs(out)
	if err != nil {
		return err
	}
	pkg := filepath.Base(filepath.Dir(absOut))

	var str strings.Builder
	fmt.Fprintf(&str, "// codegen by genfont.\n")
	fmt.Fprintf(&str, "package %s\n\n", pkg)

	varName := shishKebabToTitleCase(font.ID)
	fmt.Fprintf(&str, "var %s = Font{\n", varName)
	fmt.Fprintf(&str, "\tID: %q,\n", font.ID)
	fmt.Fprintf(&str, "\tName: %q,\n", font.Name)
	fmt.Fprintf(&str, "\tCellW: %d,\n", font.CellW)
	fmt.Fprintf(&str, "\tCellH: %d,\n", font.CellH)
	fmt.Fprintf(&str, "\tLeading: %d,\n", font.Leading)
	fmt.Fprintf(&str, "\tLineH: %d,\n", font.LineH)
	fmt.Fprintf(&str, "\tBaseline: %d,\n", font.Baseline)
	fmt.Fprintf(&str, "\tDefaultKerning: %d,\n", font.DefaultKerning)
	fmt.Fprintf(&str, "\tDefaultWhitespaceKerning: %d,\n", font.DefaultWhitespaceKerning)
	fmt.Fprintf(&str, "\tEndOfLineKerning: %d,\n", font.EndOfLineKerning)
	fmt.Fprintf(&str, "\tDefaultCharW: %d,\n", font.DefaultCharW)

	fmt.Fprintf(&str, "\tKerningPairs: map[string]int{\n")
	for k, v := range font.Kerning {
		fmt.Fprintf(&str, "\t\t%q: %d,\n", k, v)
	}
	fmt.Fprintf(&str, "\t},\n")

	fmt.Fprintf(&str, "\tCharWidths: map[string]int{\n")
	for k, v := range font.CharW {
		fmt.Fprintf(&str, "\t\t%q: %d,\n", k, v)
	}
	fmt.Fprintf(&str, "\t},\n")

	fmt.Fprintf(&str, "\tDescends: map[string]bool{\n")
	for k, v := range font.Descends {
		fmt.Fprintf(&str, "\t\t%q: %v,\n", k, v)
	}
	fmt.Fprintf(&str, "\t},\n")

	fmt.Fprintf(&str, "}\n")

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
