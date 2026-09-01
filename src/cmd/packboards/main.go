// pack Tiled TMX files into compact Go board data.
package main

import (
	"encoding/json"
	"fmt"
	"go/format"
	"os"
	"path/filepath"
	"strings"
	"unicode"
	"unicode/utf8"

	"github.com/fsnotify/fsnotify"
	"github.com/oidoid/void/src/cmd/internal/fileutils"
	"github.com/oidoid/void/src/cmd/internal/tilesetmanifest"
	"github.com/oidoid/void/src/void/vboards"
)

func main() {
	argv, err := NewArgv()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	if err := packBoards(&argv); err != nil {
		fmt.Fprintln(os.Stderr, err)
		if !argv.Watch {
			os.Exit(1)
		}
	}
	if argv.Watch {
		if err := watch(&argv); err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
	}
}

func watch(argv *Argv) (err error) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}
	defer func() {
		if closeErr := watcher.Close(); err == nil {
			err = closeErr
		}
	}()
	for _, tmx := range argv.TMXs {
		if err := watcher.Add(tmx); err != nil {
			return err
		}
	}
	if err := watcher.Add(filepath.Dir(argv.TilesetManifest)); err != nil {
		return err
	}
	for {
		select {
		case event, ok := <-watcher.Events:
			if !ok {
				return nil
			}
			ext := filepath.Ext(event.Name)
			if ext != ".tmx" && ext != ".tsx" &&
				filepath.Clean(event.Name) != filepath.Clean(argv.TilesetManifest) {
				continue
			}
			if err := packBoards(argv); err != nil {
				fmt.Fprintln(os.Stderr, err)
			}
		case err, ok := <-watcher.Errors:
			if !ok {
				return nil
			}
			fmt.Fprintln(os.Stderr, err)
		}
	}
}

func packBoards(argv *Argv) error {
	tilesetManifestBin, err := os.ReadFile(argv.TilesetManifest)
	if err != nil {
		return err
	}
	var tilesets []tilesetmanifest.TilesetManifest
	if err := json.Unmarshal(tilesetManifestBin, &tilesets); err != nil {
		return fmt.Errorf("%s: %w", argv.TilesetManifest, err)
	}
	i, err := newTilesetIndex(tilesets)
	if err != nil {
		return fmt.Errorf("%s: %w", argv.TilesetManifest, err)
	}
	paths, err := fileutils.GlobStarExt(argv.TMXs, ".tmx")
	if err != nil {
		return err
	}
	if err := os.MkdirAll(argv.Out, 0o755); err != nil {
		return err
	}
	for _, path := range paths {
		board, err := readBoard(path, i)
		if err != nil {
			return fmt.Errorf("%s: %w", path, err)
		}
		src, err := genBoard(argv.Pkg, path, &board)
		if err != nil {
			return fmt.Errorf("%s: %w", path, err)
		}
		name := strings.TrimSuffix(filepath.Base(path), filepath.Ext(path))
		out := filepath.Join(argv.Out, name+"_board.go")
		if err := os.WriteFile(out, src, 0o644); err != nil {
			return err
		}
	}
	return nil
}

func genBoard(pkg, path string, board *vboards.Board) ([]byte, error) {
	name := goName(strings.TrimSuffix(filepath.Base(path), filepath.Ext(path)))
	firstCh, _ := utf8.DecodeRuneInString(name)
	if name == "" || !unicode.IsLetter(firstCh) {
		return nil, fmt.Errorf("filename does not form a Go identifier")
	}
	bin := vboards.EncodeBoard(board)
	var str strings.Builder
	fmt.Fprintf(&str,
		"// codegen by packboards.\npackage %s\n\n"+
			"import \"github.com/oidoid/void/src/void/vboards\"\n\n"+
			"var %sBoard = vboards.DecodeBoard([]byte{",
		pkg, name,
	)
	for i, v := range bin {
		if i%16 == 0 {
			str.WriteString("\n\t")
		}
		fmt.Fprintf(&str, "0x%02x,", v)
	}
	str.WriteString("\n})\n")
	return format.Source([]byte(str.String()))
}

func goName(name string) string {
	var str strings.Builder
	upper := true
	for _, ch := range name {
		if !unicode.IsLetter(ch) && !unicode.IsDigit(ch) {
			upper = true
			continue
		}
		if upper {
			ch = unicode.ToUpper(ch)
			upper = false
		}
		str.WriteRune(ch)
	}
	return str.String()
}
