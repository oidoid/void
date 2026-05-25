package main

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"math"
	"os"
	"regexp"
	"slices"
	"strconv"
	"strings"
)

var reLine = regexp.MustCompile(`^(Benchmark\S+?)(?:-\d+)?\s+\d+\s+([\d.]+)\s+ms/op`)

// slowfile baseline record.
type Line struct {
	Name     string
	OpMillis float64
}

const (
	filename = ".slow"
	maxDelta = 0.05 // 5%.
)

func main() {
	args := os.Args[1:]

	var err error
	switch {
	case len(args) == 1 && args[0] == "save":
		err = runSave()
	case len(args) == 1 && args[0] == "check":
		err = runCheck()
	default:
		err = errors.New("go test --bench=. --count=5 | slow <check | save>")
	}

	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func check(baseline, got []Line, stdout, stderr io.Writer) error {
	byName := make(map[string]float64, len(baseline))
	for _, want := range baseline {
		byName[want.Name] = want.OpMillis
	}
	ok := true
	for _, got := range got {
		want := byName[got.Name]
		delta := (got.OpMillis - want) / want
		out := stdout
		if math.Abs(delta) > maxDelta {
			out = stderr
			ok = false
		}
		fmt.Fprintf(out, "%s: %.3f %+.1f%%\n", got.Name, got.OpMillis, delta*100)
	}
	if !ok {
		return errors.New("max delta exceeded")
	}
	return nil
}

// reads go test benchmark output and returns median per benchmark name.
func parseBenchOutput(reader io.Reader) ([]Line, error) {
	samples := map[string][]float64{}
	var order []string
	scanner := bufio.NewScanner(reader)
	for scanner.Scan() {
		matches := reLine.FindStringSubmatch(scanner.Text())
		if matches == nil {
			continue
		}
		name := matches[1]
		millis, err := strconv.ParseFloat(matches[2], 64)
		if err != nil {
			continue
		}
		if _, seen := samples[name]; !seen {
			order = append(order, name)
		}
		samples[name] = append(samples[name], millis)
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	entries := make([]Line, 0, len(order))
	for _, name := range order {
		vals := samples[name]
		slices.Sort(vals)
		entries = append(entries, Line{Name: name, OpMillis: vals[len(vals)/2]})
	}
	return entries, nil
}

func readSlow(reader io.Reader) ([]Line, error) {
	var entries []Line
	scanner := bufio.NewScanner(reader)
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) != 2 {
			continue
		}
		millis, err := strconv.ParseFloat(fields[1], 64)
		if err != nil {
			continue
		}
		entries = append(entries, Line{Name: fields[0], OpMillis: millis})
	}
	return entries, scanner.Err()
}

func runCheck() error {
	file, err := os.Open(filename)
	if err != nil {
		return fmt.Errorf("opening slowfile: %w", err)
	}
	baseline, err := readSlow(file)
	file.Close()
	if err != nil {
		return err
	}
	got, err := parseBenchOutput(os.Stdin)
	if err != nil {
		return err
	}
	return check(baseline, got, os.Stdout, os.Stderr)
}

func runSave() error {
	entries, err := parseBenchOutput(os.Stdin)
	if err != nil {
		return err
	}
	file, err := os.Create(filename)
	if err != nil {
		return fmt.Errorf("creating slowfile: %w", err)
	}
	defer file.Close()
	return writeSlow(file, entries)
}

func writeSlow(writer io.Writer, entries []Line) error {
	for _, entry := range entries {
		if _, err := fmt.Fprintf(writer, "%s %.3f\n", entry.Name, entry.OpMillis); err != nil {
			return err
		}
	}
	return nil
}
