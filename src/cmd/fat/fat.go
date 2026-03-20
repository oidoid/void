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
	args := os.Args[1:]
	if len(args) == 0 {
		runCheck()
		return
	}

	runSave(args)
}

func runCheck() {
	file, err := os.Open(baselineFilename)
	if err != nil {
		fmt.Fprintf(os.Stderr, "open %s: %v\n", baselineFilename, err)
		os.Exit(1)
	}
	defer file.Close()
	if !check(file, os.Stdout, os.Stderr) {
		os.Exit(1)
	}
}

func runSave(paths []string) {
	file, err := os.Create(baselineFilename)
	if err != nil {
		fmt.Fprintf(os.Stderr, "create %s: %v\n", baselineFilename, err)
		os.Exit(1)
	}
	defer file.Close()
	if err := save(file, paths); err != nil {
		fmt.Fprintf(os.Stderr, "%v\n", err)
		os.Exit(1)
	}
}

func check(reader io.Reader, stdout, stderr io.Writer) bool {
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
			fmt.Fprintf(stderr, "%s: bad baseline value %q: %v\n", path, wantStr, err)
			return false
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
	return ok
}

func save(writer io.Writer, paths []string) error {
	for _, path := range paths {
		stat, err := os.Stat(path)
		if err != nil {
			return err
		}
		if _, err := fmt.Fprintf(writer, "%s %d\n", path, stat.Size()); err != nil {
			return err
		}
	}
	return nil
}
