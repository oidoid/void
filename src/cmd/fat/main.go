package main

import (
	"bufio"
	"compress/gzip"
	"errors"
	"fmt"
	"io"
	"math"
	"os"
	"strconv"
	"strings"
)

// fat file record.
type Line struct {
	Path     string
	Size     int64
	GzipSize int64
}

const (
	filename = ".fat"
	maxDelta = int64(1024)
)

func main() {
	args := os.Args[1:]

	var err error
	switch {
	case len(args) >= 1 && args[0] == "save":
		err = runSave(args[1:])
	case len(args) == 1 && args[0] == "check":
		err = runCheck()
	default:
		err = fmt.Errorf("fat check | fat save files…")
	}

	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func check(reader io.Reader, stdout, stderr io.Writer) error {
	entries, err := readFat(reader)
	if err != nil {
		return err
	}
	ok := true
	for _, entry := range entries {
		stat, err := os.Stat(entry.Path)
		if err != nil {
			fmt.Fprintf(stderr, "%s: %v\n", entry.Path, errors.Unwrap(err))
			ok = false
			continue
		}
		got := stat.Size()
		delta := got - entry.Size
		deltaSign := "+"
		if delta < 0 {
			deltaSign = ""
		}

		gotGzip, err := gzipSize(entry.Path)
		if err != nil {
			fmt.Fprintf(stderr, "%s: %v\n", entry.Path, err)
			ok = false
			continue
		}
		gzipDelta := gotGzip - entry.GzipSize
		gzipDeltaSign := "+"
		if gzipDelta < 0 {
			gzipDeltaSign = ""
		}

		out := stdout
		if math.Abs(float64(delta)) > float64(maxDelta) ||
			math.Abs(float64(gzipDelta)) > float64(maxDelta) {
			out = stderr
			ok = false
		}
		_, err = fmt.Fprintf(out, "%s: %d %d %s%d %s%d\n", entry.Path, got, gotGzip, deltaSign, delta, gzipDeltaSign, gzipDelta)
		if err != nil {
			return err
		}
	}
	if !ok {
		return fmt.Errorf("max delta exceeded")
	}
	return nil
}

func gzipSize(path string) (int64, error) {
	file, err := os.Open(path)
	if err != nil {
		return 0, err
	}
	defer file.Close()
	count := &filesizeWriter{}
	// https://nginx.org/en/docs/http/ngx_http_gzip_module.html#gzip_comp_level
	gz, err := gzip.NewWriterLevel(count, gzip.BestSpeed)
	if err != nil {
		return 0, err
	}
	if _, err := io.Copy(gz, file); err != nil {
		return 0, err
	}
	if err := gz.Close(); err != nil {
		return 0, err
	}
	return count.n, nil
}

func readFat(reader io.Reader) ([]Line, error) {
	var entries []Line
	scanner := bufio.NewScanner(reader)
	for scanner.Scan() {
		parts := strings.Fields(scanner.Text())
		if len(parts) == 0 {
			continue
		}
		var size int64
		if len(parts) >= 2 {
			size, _ = strconv.ParseInt(parts[1], 10, 64)
		}
		var gz int64
		if len(parts) == 3 {
			gz, _ = strconv.ParseInt(parts[2], 10, 64)
		}
		entries = append(entries, Line{Path: parts[0], Size: size, GzipSize: gz})
	}
	return entries, scanner.Err()
}

func runCheck() error {
	file, err := os.Open(filename)
	if err != nil {
		return err
	}
	defer file.Close()
	return check(file, os.Stdout, os.Stderr)
}

func runSave(paths []string) error {
	if len(paths) == 0 {
		file, err := os.Open(filename)
		if err != nil {
			return err
		}
		entries, err := readFat(file)
		file.Close()
		if err != nil {
			return err
		}
		for _, entry := range entries {
			paths = append(paths, entry.Path)
		}
	}

	file, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer file.Close()
	return save(file, paths)
}

func save(writer io.Writer, paths []string) error {
	for _, path := range paths {
		stat, err := os.Stat(path)
		if err != nil {
			return err
		}
		gz, err := gzipSize(path)
		if err != nil {
			return err
		}
		_, err = fmt.Fprintf(writer, "%s %d %d\n", path, stat.Size(), gz)
		if err != nil {
			return err
		}
	}
	return nil
}
