package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestSave(t *testing.T) {
	dir := t.TempDir()
	paths := []string{
		writeTextToFile(t, dir, "a.text", "123"),
		writeTextToFile(t, dir, "b.text", "12345"),
	}

	var baseline strings.Builder
	if err := save(&baseline, paths); err != nil {
		t.Fatal(err)
	}

	want := fmt.Sprintf("%s 3\n%s 5\n", paths[0], paths[1])
	if got := baseline.String(); got != want {
		t.Errorf("got:\n%s\nwant:\n%s", got, want)
	}
}

func TestSave_MissingFile(t *testing.T) {
	var baseline strings.Builder
	if err := save(&baseline, []string{"/nonexistent/file.txt"}); err == nil {
		t.Fatal("want missing file err")
	}
}

func TestCheck(t *testing.T) {
	dir := t.TempDir()
	path := writeTextToFile(t, dir, "file.text", strings.Repeat("x", 100))

	var stdout, stderr strings.Builder
	if err := check(strings.NewReader(fmt.Sprintf("%s 100\n", path)), &stdout, &stderr); err != nil {
		t.Errorf("want ok, err: %v", err)
	}
	if stderr.Len() != 0 {
		t.Errorf("want empty stderr: %s", stderr.String())
	}
	wantOut := fmt.Sprintf("%s: 100 +0\n", path)
	if got := stdout.String(); got != wantOut {
		t.Errorf("stdout got:\n%s\nwant:\n%s", got, wantOut)
	}
}

func TestCheck_ExceedsMaxDelta(t *testing.T) {
	dir := t.TempDir()
	path := writeTextToFile(t, dir, "file.txt", strings.Repeat("x", 100))

	var stdout, stderr strings.Builder
	if err := check(strings.NewReader(fmt.Sprintf("%s 1125\n", path)), &stdout, &stderr); err == nil {
		t.Error("want fail: max delta exceeded")
	}
	if stdout.Len() != 0 {
		t.Errorf("want empty stdout, got: %s", stdout.String())
	}
	wantErr := fmt.Sprintf("%s: 100 -1025\n", path)
	if got := stderr.String(); got != wantErr {
		t.Errorf("stderr got:\n%s\nwant:\n%s", got, wantErr)
	}
}

func TestCheck_MissingFile(t *testing.T) {
	var stdout, stderr strings.Builder
	if err := check(strings.NewReader("/nonexistent/file.txt 100\n"), &stdout, &stderr); err == nil {
		t.Error("want fail for missing file")
	}
	if stderr.Len() == 0 {
		t.Error("want stderr output for missing file")
	}
}

func TestCheck_BadBaselineValue(t *testing.T) {
	var stdout, stderr strings.Builder
	if err := check(strings.NewReader("somefile.txt notanumber\n"), &stdout, &stderr); err == nil {
		t.Error("want fail for bad baseline value")
	}
}

func TestCheck_SkipsMalformedLines(t *testing.T) {
	dir := t.TempDir()
	path := writeTextToFile(t, dir, "file.txt", strings.Repeat("x", 10))

	baseline := fmt.Sprintf("\n   \n%s 10\n", path)
	var stdout, stderr strings.Builder
	if err := check(strings.NewReader(baseline), &stdout, &stderr); err != nil {
		t.Errorf("want ok, err: %v", err)
	}
}

func TestReadFat_OmittedSize(t *testing.T) {
	dir := t.TempDir()
	path := writeTextToFile(t, dir, "file.txt", "hello")

	entries, err := readFat(strings.NewReader(path + "\n"))
	if err != nil {
		t.Fatal(err)
	}
	if len(entries) != 1 {
		t.Fatalf("want 1 entry, got %d", len(entries))
	}
	if entries[0].path != path {
		t.Errorf("got path %q, want %q", entries[0].path, path)
	}
	if entries[0].size != 0 {
		t.Errorf("got size %d, want 0", entries[0].size)
	}
}

func writeTextToFile(t *testing.T, dir, filename, str string) string {
	t.Helper()
	path := filepath.Join(dir, filename)
	if err := os.WriteFile(path, []byte(str), 0o644); err != nil {
		t.Fatal(err)
	}
	return path
}
