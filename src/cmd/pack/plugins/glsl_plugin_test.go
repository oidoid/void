package plugins

import (
	"errors"
	"os"
	"path/filepath"
	"testing"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/oidoid/void/src/cmd/pack/cliconfig"
)

func TestLoadGLSLReadable(t *testing.T) {
	filename := filepath.Join(t.TempDir(), "test.glsl")
	want := "void main() { }\n"
	if err := os.WriteFile(filename, []byte(want), 0o644); err != nil {
		t.Fatal(err)
	}
	result := loadGLSL(
		&cliconfig.CLIConfig{},
		filename,
		func(string) (string, error) {
			t.Fatal("unexpected minifier call")
			return "", nil
		},
	)
	if len(result.Errors) > 0 {
		t.Fatal(result.Errors[0].Text)
	}
	if result.Contents == nil || *result.Contents != want {
		t.Errorf("contents = %v, want %q", result.Contents, want)
	}
	if result.Loader != api.LoaderText {
		t.Errorf("loader = %v, want text", result.Loader)
	}
	if len(result.WatchFiles) != 1 || result.WatchFiles[0] != filename {
		t.Errorf("watch files = %v, want [%s]", result.WatchFiles, filename)
	}
}

func TestLoadGLSLMinified(t *testing.T) {
	filename := "test.glsl"
	want := "void main(){}"
	result := loadGLSL(
		&cliconfig.CLIConfig{Minify: true},
		filename,
		func(gotFilename string) (string, error) {
			if gotFilename != filename {
				t.Errorf("filename = %q, want %q", gotFilename, filename)
			}
			return want, nil
		},
	)
	if len(result.Errors) > 0 {
		t.Fatal(result.Errors[0].Text)
	}
	if result.Contents == nil || *result.Contents != want {
		t.Errorf("contents = %v, want %q", result.Contents, want)
	}
}

func TestLoadGLSLMinifierError(t *testing.T) {
	result := loadGLSL(
		&cliconfig.CLIConfig{Minify: true},
		"test.glsl",
		func(string) (string, error) { return "", errors.New("bad shader") },
	)
	if len(result.Errors) != 1 || result.Errors[0].Text != "bad shader" {
		t.Errorf("errors = %v, want bad shader", result.Errors)
	}
}
