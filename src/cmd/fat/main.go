package main

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"
)

type entry struct {
	path string
	size int64
}

const (
	baselineFilename = ".fat"
	maxDelta         = int64(1024)
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
		stat, err := os.Stat(entry.path)
		if err != nil {
			fmt.Fprintf(stderr, "%s: %v\n", entry.path, errors.Unwrap(err))
			ok = false
			continue
		}
		got := stat.Size()

		delta := got - entry.size
		deltaSign := "+"
		if delta < 0 {
			deltaSign = ""
		}
		out := stdout
		if delta < -maxDelta || delta > maxDelta {
			out = stderr
			ok = false
		}
		_, err = fmt.Fprintf(out, "%s: %d %s%d\n", entry.path, got, deltaSign, delta)
		if err != nil {
			return err
		}
	}
	if !ok {
		return fmt.Errorf("max delta exceeded")
	}
	return nil
}

func readFat(reader io.Reader) ([]entry, error) {
	var entries []entry
	scanner := bufio.NewScanner(reader)
	for scanner.Scan() {
		parts := strings.Fields(scanner.Text())
		if len(parts) == 0 || len(parts) > 2 {
			continue
		}
		var size int64
		if len(parts) == 2 {
			var err error
			size, err = strconv.ParseInt(parts[1], 10, 64)
			if err != nil {
				return nil, fmt.Errorf("%s: bad baseline value %q: %w", parts[0], parts[1], err)
			}
		}
		entries = append(entries, entry{parts[0], size})
	}
	return entries, scanner.Err()
}

func runCheck() error {
	file, err := os.Open(baselineFilename)
	if err != nil {
		return err
	}
	defer file.Close()
	return check(file, os.Stdout, os.Stderr)
}

func runSave(paths []string) error {
	if len(paths) == 0 {
		file, err := os.Open(baselineFilename)
		if err != nil {
			return err
		}
		entries, err := readFat(file)
		file.Close()
		if err != nil {
			return err
		}
		for _, entry := range entries {
			paths = append(paths, entry.path)
		}
	}

	file, err := os.Create(baselineFilename)
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
		_, err = fmt.Fprintf(writer, "%s %d\n", path, stat.Size())
		if err != nil {
			return err
		}
	}
	return nil
}
