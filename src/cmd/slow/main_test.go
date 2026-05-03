package main

import (
	"strings"
	"testing"
)

// five runs: 5.1 5.5 5.9 6.3 6.7 = median 5.9.
const benchLine = "BenchmarkFoo-24\t1000\t5.903 ms/op\t0 B/op\t0 allocs/op\n"

const benchLines5 = "" +
	"BenchmarkFoo-24\t1000\t5.100 ms/op\n" +
	"BenchmarkFoo-24\t1000\t6.700 ms/op\n" +
	"BenchmarkFoo-24\t1000\t5.900 ms/op\n" +
	"BenchmarkFoo-24\t1000\t5.500 ms/op\n" +
	"BenchmarkFoo-24\t1000\t6.300 ms/op\n"

func TestParseBenchOutput(t *testing.T) {
	entries, err := parseBenchOutput(strings.NewReader(benchLine))
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 1 {
		t.Fatalf("got %d entries, want 1", len(entries))
	}
	if entries[0].Name != "BenchmarkFoo" {
		t.Errorf("got name %q, want %q", entries[0].Name, "BenchmarkFoo")
	}
	if entries[0].OpMillis != 5.903 {
		t.Errorf("got %.3f ms/op, want 5.903", entries[0].OpMillis)
	}
}

func TestParseBenchOutput_MedianOfFive(t *testing.T) {
	entries, err := parseBenchOutput(strings.NewReader(benchLines5))
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 1 {
		t.Fatalf("got %d entries, want 1", len(entries))
	}
	// sorted: 5.1 5.5 5.9 6.3 6.7 = median 5.9.
	if entries[0].OpMillis != 5.900 {
		t.Errorf("got %.3f ms/op, want 5.900 (median)", entries[0].OpMillis)
	}
}

func TestParseBenchOutput_SkipsNonBenchLines(t *testing.T) {
	input := "goos: linux\ngoarch: amd64\npkg: something\ncpu: AMD\n" + benchLine + "PASS\nok  pkg  1.000s\n"
	entries, err := parseBenchOutput(strings.NewReader(input))
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 1 {
		t.Fatalf("got %d entries, want 1", len(entries))
	}
}

func TestParseBenchOutput_SkipsNoMsOp(t *testing.T) {
	input := "BenchmarkFoo-24\t1000\t5000000 ns/op\t0 B/op\t0 allocs/op\n"
	entries, err := parseBenchOutput(strings.NewReader(input))
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 0 {
		t.Errorf("got %d entries, want 0", len(entries))
	}
}

func TestSave(t *testing.T) {
	input := "BenchmarkFoo-24\t1000\t5.903 ms/op\nBenchmarkBar-24\t1000\t9.362 ms/op\n"
	entries, err := parseBenchOutput(strings.NewReader(input))
	if err != nil {
		t.Fatal(err)
	}
	var w strings.Builder
	if err := writeSlow(&w, entries); err != nil {
		t.Fatal(err)
	}
	want := "BenchmarkFoo 5.903\nBenchmarkBar 9.362\n"
	if got := w.String(); got != want {
		t.Errorf("got:\n%s\nwant:\n%s", got, want)
	}
}

func TestReadSlow_SkipsMalformedLines(t *testing.T) {
	input := "BenchmarkFoo 5.903\nbadline\nBenchmarkBar 9.362\n"
	entries, err := readSlow(strings.NewReader(input))
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 2 {
		t.Fatalf("got %d entries, want 2", len(entries))
	}
}

func TestCheck_WithinThreshold(t *testing.T) {
	baseline := []Line{{"BenchmarkFoo", 5.000}}
	got := []Line{{"BenchmarkFoo", 5.240}} // +4.8% < 5%

	var stdout, stderr strings.Builder
	if err := check(baseline, got, &stdout, &stderr); err != nil {
		t.Errorf("want ok, got err: %v", err)
	}
	if stderr.Len() != 0 {
		t.Errorf("want empty stderr, got: %s", stderr.String())
	}
}

func TestCheck_ExceedsThreshold(t *testing.T) {
	baseline := []Line{{"BenchmarkFoo", 5.000}}
	got := []Line{{"BenchmarkFoo", 5.300}} // +6% > 5%

	var stdout, stderr strings.Builder
	if err := check(baseline, got, &stdout, &stderr); err == nil {
		t.Error("want fail: max delta exceeded")
	}
	if stderr.Len() == 0 {
		t.Error("want stderr output on regression")
	}
	if stdout.Len() != 0 {
		t.Errorf("want empty stdout, got: %s", stdout.String())
	}
}

func TestCheck_ImprovementWithinThreshold(t *testing.T) {
	baseline := []Line{{"BenchmarkFoo", 5.000}}
	got := []Line{{"BenchmarkFoo", 4.760}} // -4.8%, within 5%

	var stdout, stderr strings.Builder
	if err := check(baseline, got, &stdout, &stderr); err != nil {
		t.Errorf("want ok for small improvement, got err: %v", err)
	}
}

func TestCheck_ImprovementExceedsThreshold(t *testing.T) {
	baseline := []Line{{"BenchmarkFoo", 10.000}}
	got := []Line{{"BenchmarkFoo", 8.000}} // -20%, exceeds ±5%

	var stdout, stderr strings.Builder
	if err := check(baseline, got, &stdout, &stderr); err == nil {
		t.Error("want fail: absolute delta exceeded")
	}
}

func TestCheck_MissingBaseline(t *testing.T) {
	got := []Line{{"BenchmarkFoo", 5.000}}

	var stdout, stderr strings.Builder
	if err := check(nil, got, &stdout, &stderr); err == nil {
		t.Error("want fail: no baseline")
	}
}
