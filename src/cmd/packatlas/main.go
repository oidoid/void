// pack a sprite atlas.
package main

import (
	_ "embed"
	"fmt"
	"go/format"
	"image/png"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"text/template"

	"github.com/fsnotify/fsnotify"
	"github.com/oidoid/void/src/cmd/internal/fileutils"
	"github.com/oidoid/void/src/void/vatlas"
)

var initialisms = map[string]bool{"UI": true}

//go:embed atlas_bin.gotmpl
var atlasBinTemplSrc string
var atlasBinTempl = template.Must(template.New(
	"atlas_bin.gotmpl",
).Parse(atlasBinTemplSrc))

//go:embed atlas_tags.gotmpl
var atlasTagsTemplSrc string
var atlasTagsTempl = template.Must(template.New(
	"atlas_tags.gotmpl",
).Funcs(
	template.FuncMap{
		"tag": func(tag stemTag) string { return tag.qualifiedTag() },
	},
).Parse(atlasTagsTemplSrc))

func main() {
	argv, err := NewArgv()
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	if err := packAtlas(&argv); err != nil {
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

func watch(argv *Argv) error {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return err
	}
	defer func() {
		if closeErr := watcher.Close(); err == nil {
			err = closeErr
		}
	}()
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
	assets := make([]*asset, 0, len(ases))
	for _, path := range ases {
		asset, err := readAsset(path)
		if err != nil {
			return fmt.Errorf("parse: %w", err)
		}
		assets = append(assets, asset)
	}
	img, atlas, stemTags, err := parseAtlas(assets)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(argv.ImgOut, 0o755); err != nil {
		return err
	}
	sheet := filepath.Join(argv.ImgOut, argv.Name+".png")
	f, err := os.Create(sheet)
	if err != nil {
		return err
	}
	err = png.Encode(f, img)
	closeErr := f.Close()
	if err != nil {
		return err
	}
	if closeErr != nil {
		return closeErr
	}
	if err := pngToWebP(
		sheet,
		filepath.Join(argv.ImgOut, argv.Name+".webp"),
	); err != nil {
		return fmt.Errorf("converting to WebP: %w", err)
	}
	atlasBin := vatlas.EncodeAtlas(atlas)
	binSrc, err := genBin(
		filepath.Base(filepath.Dir(argv.AtlasOut)), atlasBin,
	)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(argv.AtlasOut), 0o755); err != nil {
		return err
	}
	if err := os.WriteFile(argv.AtlasOut, binSrc, 0o644); err != nil {
		return err
	}
	tagsSrc, err := genTags(
		filepath.Base(filepath.Dir(argv.TagsOut)), stemTags,
	)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(argv.TagsOut), 0o755); err != nil {
		return err
	}
	if err := os.WriteFile(argv.TagsOut, tagsSrc, 0o644); err != nil {
		return err
	}
	if argv.TilesetManifestOut == "" {
		return nil
	}
	tilesetManifestBin, err := genTilesetManifest(assets, stemTags)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(argv.TilesetManifestOut), 0o755); err != nil {
		return err
	}
	return os.WriteFile(argv.TilesetManifestOut, tilesetManifestBin, 0o644)
}

func genBin(pkg string, bin []byte) ([]byte, error) {
	var str strings.Builder
	templData := struct {
		Pkg string
		Bin []byte
	}{pkg, bin}
	if err := atlasBinTempl.Execute(&str, &templData); err != nil {
		return nil, fmt.Errorf("executing atlas bin template: %w", err)
	}
	return format.Source([]byte(str.String()))
}

func genTags(pkg string, stemTags []stemTag) ([]byte, error) {
	var str strings.Builder
	templData := struct {
		Pkg  string
		Tags []stemTag
	}{pkg, stemTags}
	if err := atlasTagsTempl.Execute(&str, &templData); err != nil {
		return nil, fmt.Errorf("executing atlas tags template: %w", err)
	}
	return format.Source([]byte(str.String()))
}

func pngToWebP(src, dst string) error {
	return exec.Command(
		"cwebp", "-exact", "-lossless", "-mt", "-quiet", "-z", "9", src, "-o", dst,
	).Run()
}
