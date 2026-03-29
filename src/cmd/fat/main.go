package main

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"
)

const (
	baselineFilename = ".fat"
	maxDelta         = int64(1024)
)

func main() {
	var err error

	args := os.Args[1:]
	if len(args) == 0 {
		err = runCheck()
	} else {
		err = runSave(args)
	}

	if err != nil {
		fmt.Fprintf(os.Stderr, "%v\n", err)
		os.Exit(1)
	}
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
	file, err := os.Create(baselineFilename)
	if err != nil {
		return err
	}
	defer file.Close()
	return save(file, paths)
}

func check(reader io.Reader, stdout, stderr io.Writer) error {
	ok := true
	scanner := bufio.NewScanner(reader)
	for scanner.Scan() {
		parts := strings.Fields(scanner.Text())
		if len(parts) != 2 {
			continue
		}
		path, wantStr := parts[0], parts[1]

		want, err := strconv.ParseInt(wantStr, 10, 64)
		if err != nil {
			return fmt.Errorf("%s: bad baseline value %q: %w", path, wantStr, err)
		}

		stat, err := os.Stat(path)
		if err != nil {
			fmt.Fprintf(stderr, "%v\n", err)
			ok = false
			continue
		}
		got := stat.Size()

		delta := got - want
		deltaSign := "+"
		if delta < 0 {
			deltaSign = ""
		}
		out := stdout
		if delta < -maxDelta || delta > maxDelta {
			out = stderr
			ok = false
		}
		fmt.Fprintf(out, "%s: %d %s%d\n", path, want, deltaSign, delta)
	}
	if !ok {
		return fmt.Errorf("max delta exceeded")
	}
	return nil
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
