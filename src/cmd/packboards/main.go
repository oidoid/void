// pack Tiled TMX files into compact Go board data.
package main

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"go/format"
	"os"
	"path/filepath"
	"strings"
	"text/template"
	"unicode"
	"unicode/utf8"

	"github.com/fsnotify/fsnotify"
	"github.com/oidoid/void/src/cmd/internal/fileutils"
	"github.com/oidoid/void/src/cmd/internal/tilesetmanifest"
	"github.com/oidoid/void/src/void/vboards"
)

//go:embed board.gotmpl
var boardTemplSrc string
var boardTempl = template.Must(template.New("board.gotmpl").Funcs(
	template.FuncMap{
		"name": goName,
	},
).Parse(boardTemplSrc))

//go:embed spawn.gotmpl
var spawnTemplSrc string
var spawnTempl = template.Must(template.New("spawn.gotmpl").Funcs(
	template.FuncMap{"name": goName},
).Parse(spawnTemplSrc))

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
	var manifest tilesetmanifest.TilesetManifestSpec
	if err := json.Unmarshal(tilesetManifestBin, &manifest); err != nil {
		return fmt.Errorf("%s: %w", argv.TilesetManifest, err)
	}
	i, err := newTilesetIndex(manifest.Tilesets)
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
	boards := make([]spawnBoardSpec, len(paths))
	boardSrcs := make([][]byte, len(paths))
	for boardI, path := range paths {
		board, err := readBoard(path, i, manifest.Tags)
		if err != nil {
			return fmt.Errorf("%s: %w", path, err)
		}
		boards[boardI] = board
	}
	groups, err := mergeSpawns(paths, boards)
	if err != nil {
		return err
	}
	spawnSrc, err := genSpawns(argv.Pkg, groups)
	if err != nil {
		return err
	}
	for boardI, path := range paths {
		boardSrcs[boardI], err = genBoard(
			argv.Pkg, path, vboards.Level(boardI+1), &boards[boardI],
		)
		if err != nil {
			return fmt.Errorf("%s: %w", path, err)
		}
	}
	if err := os.WriteFile(
		filepath.Join(argv.Out, "spawn.go"), spawnSrc, 0o644,
	); err != nil {
		return err
	}
	for boardI, path := range paths {
		name := strings.TrimSuffix(filepath.Base(path), filepath.Ext(path))
		out := filepath.Join(argv.Out, name+"_board.go")
		if err := os.WriteFile(out, boardSrcs[boardI], 0o644); err != nil {
			return err
		}
	}
	return nil
}

func mergeSpawns(
	paths []string, boards []spawnBoardSpec,
) ([]spawnGroupSpec, error) {
	groups := make([]spawnGroupSpec, 0)
	groupIndices := make(map[string]int)
	for boardI := range boards {
		for _, group := range boards[boardI].Spawns {
			groupI, ok := groupIndices[group.Class]
			if !ok {
				groupI = len(groups)
				groupIndices[group.Class] = groupI
				groups = append(groups, spawnGroupSpec{Class: group.Class})
			}
			if err := mergeSpawnProps(&groups[groupI], group.Props); err != nil {
				return nil, fmt.Errorf(
					"%s class %q: %w", paths[boardI], group.Class, err,
				)
			}
		}
	}
	for boardI := range boards {
		for groupI := range boards[boardI].Spawns {
			group := &boards[boardI].Spawns[groupI]
			group.Props = groups[groupIndices[group.Class]].Props
		}
	}
	return groups, nil
}

func genBoard(
	pkg, path string,
	level vboards.Level,
	board *spawnBoardSpec,
) ([]byte, error) {
	name := goName(strings.TrimSuffix(filepath.Base(path), filepath.Ext(path)))
	firstCh, _ := utf8.DecodeRuneInString(name)
	if name == "" || !unicode.IsLetter(firstCh) {
		return nil, fmt.Errorf("filename does not form a Go identifier")
	}
	if err := validateSpawnGroups(board.Spawns); err != nil {
		return nil, err
	}
	var str strings.Builder
	data := struct {
		Pkg   string
		Name  string
		Level vboards.Level
		Bin   []byte
		Board *spawnBoardSpec
	}{pkg, name, level, vboards.EncodeBoard(&board.Board), board}
	if err := boardTempl.Execute(&str, &data); err != nil {
		return nil, fmt.Errorf("executing board template: %w", err)
	}
	return format.Source([]byte(str.String()))
}

func validateSpawnGroups(groups []spawnGroupSpec) error {
	classNames := make(map[string]string, len(groups))
	for _, group := range groups {
		className := goName(group.Class)
		firstCh, _ := utf8.DecodeRuneInString(className)
		if className == "" || !unicode.IsLetter(firstCh) {
			return fmt.Errorf(
				"object class %q does not form a Go identifier", group.Class,
			)
		}
		if other, ok := classNames[className]; ok {
			return fmt.Errorf(
				"object classes %q and %q form the same Go identifier",
				other,
				group.Class,
			)
		}
		classNames[className] = group.Class
		propNames := make(map[string]string, len(group.Props))
		for _, prop := range group.Props {
			propName := goName(prop.Name)
			firstCh, _ := utf8.DecodeRuneInString(propName)
			if propName == "" || !unicode.IsLetter(firstCh) {
				return fmt.Errorf(
					"object prop %q does not form a Go identifier", prop.Name,
				)
			}
			if other, ok := propNames[propName]; ok {
				return fmt.Errorf(
					"object props %q and %q form the same Go identifier",
					other, prop.Name,
				)
			}
			propNames[propName] = prop.Name
		}
	}
	return nil
}

func genSpawns(pkg string, groups []spawnGroupSpec) ([]byte, error) {
	if err := validateSpawnGroups(groups); err != nil {
		return nil, err
	}
	usesXY := false
	for _, group := range groups {
		for _, prop := range group.Props {
			usesXY = usesXY || prop.IsXY()
		}
	}
	data := struct {
		Pkg    string
		Groups []spawnGroupSpec
		UsesXY bool
	}{pkg, groups, usesXY}
	var str strings.Builder
	if err := spawnTempl.Execute(&str, &data); err != nil {
		return nil, fmt.Errorf("executing spawn template: %w", err)
	}
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
