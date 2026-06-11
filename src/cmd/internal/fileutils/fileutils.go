package fileutils

import (
	"os"
	"path/filepath"
)

func GlobStarExt(entries []string, ext string) ([]string, error) {
	var paths []string
	for _, entry := range entries {
		err := filepath.WalkDir(
			entry,
			func(path string, entry os.DirEntry, err error) error {
				if err != nil {
					return err
				}
				if !entry.IsDir() && filepath.Ext(path) == ext {
					paths = append(paths, path)
				}
				return nil
			},
		)
		if err != nil {
			return nil, err
		}
	}
	return paths, nil
}
