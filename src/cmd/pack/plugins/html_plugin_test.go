package plugins

import (
	"encoding/base64"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/oidoid/void/src/cmd/pack/cliconfig"
	"golang.org/x/net/html"
)

func TestTransformFavicons_OneFile(t *testing.T) {
	config, entryDir := mockCLIConfig(t, true)
	os.WriteFile(filepath.Join(entryDir, "icon.png"), []byte("png"), 0o644)

	doc := parseDoc(t, `<html><head><link rel="icon" href="icon.png"></head></html>`)
	if result := transformFavicons(doc, config, entryDir); len(result.Errors) > 0 {
		t.Fatal(result.Errors[0].Text)
	}

	out := renderDoc(t, doc)
	if !strings.Contains(out, "data:image/png;base64,") {
		t.Errorf("expected data URI, got: %s", out)
	}
}

func TestTransformFavicons_NotOneFile(t *testing.T) {
	config, entryDir := mockCLIConfig(t, false)
	os.WriteFile(filepath.Join(entryDir, "icon.png"), []byte("png"), 0o644)

	doc := parseDoc(t, `<html><head><link rel="icon" href="icon.png"></head></html>`)
	if result := transformFavicons(doc, config, entryDir); len(result.Errors) > 0 {
		t.Fatal(result.Errors[0].Text)
	}

	out := renderDoc(t, doc)
	if !strings.Contains(out, `href="icon.png"`) {
		t.Errorf("expected href=icon.png, got: %s", out)
	}
	if _, err := os.Stat(filepath.Join(config.OutDir, "icon.png")); err != nil {
		t.Errorf("expected icon.png copied to outDir: %v", err)
	}
}

func TestTransformImages_OneFile(t *testing.T) {
	config, entryDir := mockCLIConfig(t, true)
	os.WriteFile(filepath.Join(entryDir, "img.png"), []byte("png"), 0o644)

	doc := parseDoc(t, `<html><body><img src="img.png"></body></html>`)
	if result := transformImages(doc, config, entryDir); len(result.Errors) > 0 {
		t.Fatal(result.Errors[0].Text)
	}

	out := renderDoc(t, doc)
	if !strings.Contains(out, "data:image/png;base64,") {
		t.Errorf("expected data URI, got: %s", out)
	}
}

func TestTransformImages_NotOneFile(t *testing.T) {
	config, entryDir := mockCLIConfig(t, false)
	os.WriteFile(filepath.Join(entryDir, "img.png"), []byte("png"), 0o644)

	doc := parseDoc(t, `<html><body><img src="img.png"></body></html>`)
	if result := transformImages(doc, config, entryDir); len(result.Errors) > 0 {
		t.Fatal(result.Errors[0].Text)
	}

	out := renderDoc(t, doc)
	if !strings.Contains(out, `src="img.png"`) {
		t.Errorf("expected src=img.png, got: %s", out)
	}
	if _, err := os.Stat(filepath.Join(config.OutDir, "img.png")); err != nil {
		t.Errorf("expected img.png copied to outDir: %v", err)
	}
}

func TestTransformManifests_OneFile(t *testing.T) {
	config, entryDir := mockCLIConfig(t, true)
	os.WriteFile(filepath.Join(entryDir, "icon.png"), []byte("png"), 0o644)
	manifest := map[string]any{
		"name":  "Test",
		"icons": []any{map[string]any{"src": "icon.png", "sizes": "192x192"}},
	}
	manifestBin, _ := json.Marshal(manifest)
	os.WriteFile(filepath.Join(entryDir, "manifest.json"), manifestBin, 0o644)

	doc := parseDoc(t, `<html><head><link rel="manifest" href="manifest.json"></head></html>`)
	if result := transformManifests(doc, config, entryDir); len(result.Errors) > 0 {
		t.Fatal(result.Errors[0].Text)
	}

	out := renderDoc(t, doc)
	if !strings.Contains(out, "data:application/manifest+json;base64,") {
		t.Errorf("expected manifest data URI, got: %s", out)
	}
	// Decode and verify icon was inlined
	hrefStart := strings.Index(out, "data:application/manifest+json;base64,") + len("data:application/manifest+json;base64,")
	hrefEnd := strings.IndexByte(out[hrefStart:], '"') + hrefStart
	decoded, err := base64.StdEncoding.DecodeString(out[hrefStart:hrefEnd])
	if err != nil {
		t.Fatalf("base64 decode: %v", err)
	}
	var got map[string]any
	json.Unmarshal(decoded, &got)
	icons := got["icons"].([]any)
	iconSrc := icons[0].(map[string]any)["src"].(string)
	if !strings.HasPrefix(iconSrc, "data:image/png;base64,") {
		t.Errorf("expected icon inlined as data URI, got: %s", iconSrc)
	}
}

func TestTransformManifests_NotOneFile(t *testing.T) {
	config, entryDir := mockCLIConfig(t, false)
	os.WriteFile(filepath.Join(entryDir, "icon.png"), []byte("png"), 0o644)
	manifest := map[string]any{
		"name":  "Test",
		"icons": []any{map[string]any{"src": "icon.png", "sizes": "192x192"}},
	}
	manifestBin, _ := json.Marshal(manifest)
	os.WriteFile(filepath.Join(entryDir, "manifest.json"), manifestBin, 0o644)

	doc := parseDoc(t, `<html><head><link rel="manifest" href="manifest.json"></head></html>`)
	if result := transformManifests(doc, config, entryDir); len(result.Errors) > 0 {
		t.Fatal(result.Errors[0].Text)
	}

	out := renderDoc(t, doc)
	if !strings.Contains(out, `href="manifest.json"`) {
		t.Errorf("expected href=manifest.json, got: %s", out)
	}
	if _, err := os.Stat(filepath.Join(config.OutDir, "manifest.json")); err != nil {
		t.Errorf("expected manifest.json copied to outDir: %v", err)
	}
	if _, err := os.Stat(filepath.Join(config.OutDir, "icon.png")); err != nil {
		t.Errorf("expected icon.png copied to outDir: %v", err)
	}
}

func TestTransformScripts_OneFile(t *testing.T) {
	config, _ := mockCLIConfig(t, true)
	os.WriteFile(filepath.Join(config.OutDir, "index.js"), []byte("console.log(1)"), 0o644)

	doc := parseDoc(t, `<html><head><script type="module" src="index.ts"></script></head></html>`)
	if result := transformScripts(doc, config); len(result.Errors) > 0 {
		t.Fatal(result.Errors[0].Text)
	}

	out := renderDoc(t, doc)
	if strings.Contains(out, `src=`) {
		t.Errorf("expected src removed, got: %s", out)
	}
	if !strings.Contains(out, "console.log(1)") {
		t.Errorf("expected inlined JS, got: %s", out)
	}
}

func TestTransformScripts_NotOneFile(t *testing.T) {
	config, _ := mockCLIConfig(t, false)

	doc := parseDoc(t, `<html><head><script type="module" src="index.ts"></script></head></html>`)
	if result := transformScripts(doc, config); len(result.Errors) > 0 {
		t.Fatal(result.Errors[0].Text)
	}

	out := renderDoc(t, doc)
	if !strings.Contains(out, `src="index.js"`) {
		t.Errorf("expected src rewritten to .js, got: %s", out)
	}
}

func TestTransformScripts_NonModuleSkipped(t *testing.T) {
	config, _ := mockCLIConfig(t, false)

	doc := parseDoc(t, `<html><head><script src="other.js"></script></head></html>`)
	if result := transformScripts(doc, config); len(result.Errors) > 0 {
		t.Fatal(result.Errors[0].Text)
	}

	out := renderDoc(t, doc)
	if !strings.Contains(out, `src="other.js"`) {
		t.Errorf("expected non-module script left unchanged, got: %s", out)
	}
}

func TestTransformStylesheets_OneFile(t *testing.T) {
	config, _ := mockCLIConfig(t, true)
	os.WriteFile(filepath.Join(config.OutDir, "style.css"), []byte("body{margin:0}"), 0o644)

	doc := parseDoc(t, `<html><head><link rel="stylesheet" href="style.css"></head></html>`)
	if result := transformStylesheets(doc, config); len(result.Errors) > 0 {
		t.Fatal(result.Errors[0].Text)
	}

	out := renderDoc(t, doc)
	if strings.Contains(out, "<link") {
		t.Errorf("expected <link> replaced, got: %s", out)
	}
	if !strings.Contains(out, "<style>") {
		t.Errorf("expected <style> element, got: %s", out)
	}
	if !strings.Contains(out, "body{margin:0}") {
		t.Errorf("expected inlined CSS, got: %s", out)
	}
}

func TestTransformStylesheets_NotOneFile(t *testing.T) {
	config, _ := mockCLIConfig(t, false)
	os.WriteFile(filepath.Join(config.OutDir, "style.css"), []byte("body{margin:0}"), 0o644)

	doc := parseDoc(t, `<html><head><link rel="stylesheet" href="style.css"></head></html>`)
	if result := transformStylesheets(doc, config); len(result.Errors) > 0 {
		t.Fatal(result.Errors[0].Text)
	}

	out := renderDoc(t, doc)
	if !strings.Contains(out, `href="style.css"`) {
		t.Errorf("expected href rewritten to basename, got: %s", out)
	}
}

func TestTransformHTML(t *testing.T) {
	config, entryDir := mockCLIConfig(t, false)
	entry := filepath.Join(entryDir, "index.html")

	os.WriteFile(entry, []byte(`<html><head>
		<link rel="stylesheet" href="style.css">
		<script type="module" src="index.ts"></script>
	</head><body><img src="img.png"></body></html>`), 0o644)
	os.WriteFile(filepath.Join(entryDir, "img.png"), []byte("png"), 0o644)
	os.WriteFile(filepath.Join(config.OutDir, "style.css"), []byte("body{margin:0}"), 0o644)
	os.WriteFile(filepath.Join(config.OutDir, "index.js"), []byte("console.log(1)"), 0o644)

	if result := transformHTML(config, entry, entryDir); len(result.Errors) > 0 {
		t.Fatal(result.Errors[0].Text)
	}

	bin, err := os.ReadFile(filepath.Join(config.OutDir, "index.html"))
	if err != nil {
		t.Fatalf("output HTML not written: %v", err)
	}
	out := string(bin)
	if !strings.Contains(out, `href="style.css"`) {
		t.Errorf("expected stylesheet href, got: %s", out)
	}
	if !strings.Contains(out, `src="index.js"`) {
		t.Errorf("expected script src rewritten to .js, got: %s", out)
	}
	if !strings.Contains(out, `src="img.png"`) {
		t.Errorf("expected img copied and rewritten, got: %s", out)
	}
	if _, err := os.Stat(filepath.Join(config.OutDir, "img.png")); err != nil {
		t.Errorf("expected img.png in outDir: %v", err)
	}
}

func mockCLIConfig(t *testing.T, oneFile bool) (*cliconfig.CLIConfig, string) {
	t.Helper()
	entryDir := t.TempDir()
	return &cliconfig.CLIConfig{
		OutDir:  t.TempDir(),
		OneFile: oneFile,
	}, entryDir
}

func parseDoc(t *testing.T, src string) *html.Node {
	t.Helper()
	doc, err := html.Parse(strings.NewReader(src))
	if err != nil {
		t.Fatalf("html.Parse: %v", err)
	}
	return doc
}

func renderDoc(t *testing.T, doc *html.Node) string {
	t.Helper()
	var buf strings.Builder
	if err := html.Render(&buf, doc); err != nil {
		t.Fatalf("html.Render: %v", err)
	}
	return buf.String()
}
