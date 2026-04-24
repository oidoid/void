// pack a sprite atlas.

package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/fsnotify/fsnotify"
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

func globStarExt(entries []string, ext string) ([]string, error) {
	var paths []string
	for _, entry := range entries {
		err := filepath.WalkDir(entry, func(path string, entry os.DirEntry, err error) error {
			if err != nil {
				return err
			}
			if !entry.IsDir() && filepath.Ext(path) == ext {
				paths = append(paths, path)
			}
			return nil
		})
		if err != nil {
			return nil, err
		}
	}
	return paths, nil
}

func packAtlas(argv *Argv) error {
	ases, err := globStarExt(argv.Entries, ".aseprite")
	if err != nil {
		return err
	}
	sheet := filepath.Join(argv.OutDir, argv.Name+".png")
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
	json, err := exec.Command("aseprite", args...).Output()
	if err != nil {
		return err
	}
	if !argv.NoWebP {
		if err := pngToWebP(sheet, filepath.Join(argv.OutDir, argv.Name+".webp")); err != nil {
			fmt.Println("cwebp failed")
			return err
		}
	}
	jsonFile := filepath.Join(argv.OutDir, argv.Name+".json")
	return os.WriteFile(jsonFile, json, 0o644)
}

func pngToWebP(src, dst string) error {
	return exec.Command(
		"cwebp", "-exact", "-lossless", "-mt", "-quiet", "-z", "9", src, "-o", dst,
	).Run()
}
