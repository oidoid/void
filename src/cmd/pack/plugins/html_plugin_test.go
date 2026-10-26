package plugins

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/oidoid/void/src/cmd/pack/cliconfig"
	"github.com/oidoid/void/src/cmd/pack/htmlparser"
	"golang.org/x/net/html"
)

func TestTransformFavicons_OneFile(t *testing.T) {
	config, entryDir := mockCLIConfig(t, true)
	os.WriteFile(filepath.Join(entryDir, "icon.png"), []byte("png"), 0o644)

	doc := parseDoc(t,
		`<html><head><link rel="icon" href="icon.png"></head></html>`)
	if result := transformFavicons(doc, config, entryDir); len(
		result.Errors,
	) > 0 {
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

	doc := parseDoc(t,
		`<html><head><link rel="icon" href="icon.png"></head></html>`)
	if result := transformFavicons(doc, config, entryDir); len(
		result.Errors,
	) > 0 {
		t.Fatal(result.Errors[0].Text)
	}

	out := renderDoc(t, doc)
	if !strings.Contains(out, `href="icon.png"`) {
		t.Errorf("expected href=icon.png, got: %s", out)
	}
	if _, err := os.Stat(
		filepath.Join(config.OutDir, "icon.png"),
	); err != nil {
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

func TestTransformImages_AlreadyInOutDir(t *testing.T) {
	config, _ := mockCLIConfig(t, false)
	filename := filepath.Join(config.OutDir, "atlas.webp")
	if err := os.WriteFile(filename, []byte("pixels"), 0o644); err != nil {
		t.Fatal(err)
	}
	modified := time.Unix(1, 0)
	if err := os.Chtimes(filename, modified, modified); err != nil {
		t.Fatal(err)
	}
	doc := parseDoc(t, `<html><body><img src="atlas.webp"></body></html>`)
	if result := transformImages(doc, config, config.OutDir); len(result.Errors) > 0 {
		t.Fatal(result.Errors)
	}
	stat, err := os.Stat(filename)
	if err != nil {
		t.Fatal(err)
	}
	if !stat.ModTime().Equal(modified) {
		t.Fatal("rewrote the watched atlas in place")
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
	os.WriteFile(filepath.Join(entryDir, "manifest.json"),
		manifestBin, 0o644)

	doc := parseDoc(t,
		`<html><head><link rel="manifest" href="manifest.json"></head></html>`)
	if result := transformManifests(doc, config, entryDir); len(
		result.Errors,
	) > 0 {
		t.Fatal(result.Errors[0].Text)
	}

	out := renderDoc(t, doc)
	if !strings.Contains(out, "data:application/manifest+json;base64,") {
		t.Errorf("expected manifest data URI, got: %s", out)
	}
	// Decode and verify icon was inlined
	prefix := "data:application/manifest+json;base64,"
	hrefStart := strings.Index(out, prefix) + len(prefix)
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
	config.WatchPort = 1234
	os.WriteFile(filepath.Join(entryDir, "icon.png"), []byte("png"), 0o644)
	manifest := map[string]any{
		"name":  "Test",
		"icons": []any{map[string]any{"src": "icon.png", "sizes": "192x192"}},
	}
	manifestBin, _ := json.Marshal(manifest)
	os.WriteFile(
		filepath.Join(entryDir, "manifest.json"),
		manifestBin,
		0o644,
	)

	doc := parseDoc(
		t,
		`<html><head><link rel="manifest" href="manifest.json"></head></html>`,
	)
	if result := transformManifests(doc, config, entryDir); len(
		result.Errors,
	) > 0 {
		t.Fatal(result.Errors[0].Text)
	}

	out := renderDoc(t, doc)
	if !strings.Contains(out, `href="manifest.json"`) {
		t.Errorf("expected href=manifest.json, got: %s", out)
	}
	if _, err := os.Stat(
		filepath.Join(config.OutDir, "manifest.json"),
	); err != nil {
		t.Errorf("expected manifest.json copied to outDir: %v", err)
	}
	if _, err := os.Stat(
		filepath.Join(config.OutDir, "icon.png"),
	); err != nil {
		t.Errorf("expected icon.png copied to outDir: %v", err)
	}
	manifestBin, err := os.ReadFile(filepath.Join(config.OutDir, "manifest.json"))
	if err != nil {
		t.Fatal(err)
	}
	var got map[string]any
	if err := json.Unmarshal(manifestBin, &got); err != nil {
		t.Fatal(err)
	}
	if got["start_url"] != "." {
		t.Errorf("start_url = %v, want .", got["start_url"])
	}
}

func TestTransformScripts_OneFile(t *testing.T) {
	config, _ := mockCLIConfig(t, true)
	os.WriteFile(filepath.Join(config.OutDir, "index.js"),
		[]byte("console.log(1)"), 0o644)

	doc := parseDoc(
		t,
		`<html><head><script type="module" src="index.ts"></script></head></html>`,
	)
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

	doc := parseDoc(
		t,
		`<html><head><script type="module" src="index.ts"></script></head></html>`,
	)
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

	doc := parseDoc(
		t,
		`<html><head><script src="other.js"></script></head></html>`,
	)
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
	os.WriteFile(
		filepath.Join(config.OutDir, "style.css"),
		[]byte("body{margin:0}"),
		0o644,
	)

	doc := parseDoc(
		t,
		`<html><head><link rel="stylesheet" href="style.css"></head></html>`,
	)
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
	os.WriteFile(
		filepath.Join(config.OutDir, "style.css"),
		[]byte("body{margin:0}"),
		0o644,
	)

	doc := parseDoc(
		t,
		`<html><head><link rel="stylesheet" href="style.css"></head></html>`,
	)
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
	os.WriteFile(
		filepath.Join(config.OutDir, "style.css"),
		[]byte("body{margin:0}"),
		0o644,
	)
	os.WriteFile(
		filepath.Join(config.OutDir, "index.js"),
		[]byte("console.log(1)"),
		0o644,
	)

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

func TestHTMLPluginWatchesAssets(t *testing.T) {
	dir := t.TempDir()
	out := filepath.Join(dir, "dist")
	if err := os.Mkdir(out, 0o755); err != nil {
		t.Fatal(err)
	}
	files := map[string]string{
		"index.js": `import wasm from './dist/index.wasm' with {type: 'url'};
console.log(wasm);`,
		"index.html": `<html><head>
<link rel="stylesheet" href="index.css">
<link rel="icon" href="dist/icon.webp">
<link rel="manifest" href="manifest.json">
<script type="module" src="index.js"></script>
</head><body><img id="atlas" src="dist/atlas.webp">
<img src="dist/other.custom"></body></html>`,
		"index.css":         "body {color: red}",
		"manifest.json":     `{"icons":[{"src":"dist/app.webp"}]}`,
		"dist/index.wasm":   "unchanged wasm",
		"dist/atlas.webp":   "atlas pixels",
		"dist/other.custom": "other pixels",
		"dist/icon.webp":    "favicon pixels",
		"dist/app.webp":     "app icon pixels",
	}
	for name, contents := range files {
		if err := os.WriteFile(
			filepath.Join(dir, name), []byte(contents), 0o644,
		); err != nil {
			t.Fatal(err)
		}
	}
	config := &cliconfig.CLIConfig{
		Entries:   []string{filepath.Join(dir, "index.html")},
		OutDir:    out,
		WatchPort: 1234,
	}
	entries, _, parseErr := htmlparser.ParseEntries(config.Entries[0])
	if parseErr != nil {
		t.Fatal(parseErr)
	}
	builds := make(chan api.BuildResult, 16)
	ctx, err := api.Context(api.BuildOptions{
		Bundle: true, Format: api.FormatESModule, Write: true,
		EntryPoints: entries,
		Outdir:      out,
		LogLevel:    api.LogLevelSilent,
		Plugins: []api.Plugin{
			HTMLPlugin(config), WasmPlugin(config),
			{Name: "capture", Setup: func(build api.PluginBuild) {
				build.OnEnd(func(result *api.BuildResult) (api.OnEndResult, error) {
					builds <- *result
					return api.OnEndResult{}, nil
				})
			}},
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	defer ctx.Dispose()
	if err := ctx.Watch(api.WatchOptions{}); err != nil {
		t.Fatal(err)
	}
	wait := func(t *testing.T) api.BuildResult {
		t.Helper()
		select {
		case result := <-builds:
			return result
		case <-time.After(5 * time.Second):
			t.Fatal("HTML asset change did not trigger a rebuild")
			return api.BuildResult{}
		}
	}
	jsHash := func(t *testing.T, result api.BuildResult) string {
		t.Helper()
		if len(result.Errors) != 0 {
			t.Fatalf("build errors: %v", result.Errors)
		}
		for _, file := range result.OutputFiles {
			if strings.HasSuffix(file.Path, ".js") {
				return file.Hash
			}
		}
		t.Fatal("missing JavaScript output")
		return ""
	}
	prev := jsHash(t, wait(t))
	for _, name := range []string{
		"dist/atlas.webp", "dist/icon.webp", "dist/app.webp",
		"dist/other.custom", "manifest.json", "index.html",
		"index.js", "index.css", "dist/index.wasm",
	} {
		t.Run(name, func(t *testing.T) {
			// replace atomically, as sprite exporters and editors often do.
			tmp := filepath.Join(dir, "replacement")
			if err := os.WriteFile(tmp, []byte(files[name]+" "), 0o644); err != nil {
				t.Fatal(err)
			}
			if err := os.Rename(tmp, filepath.Join(dir, name)); err != nil {
				t.Fatal(err)
			}
			hash := jsHash(t, wait(t))
			if hash == prev {
				t.Fatal("JavaScript did not change; esbuild would not send a reload")
			}
			prev = hash
		})
	}
	// dependencies added by an HTML edit must be watched on the next build.
	added := filepath.Join(out, "added.custom")
	if err := os.WriteFile(added, []byte("new image"), 0o644); err != nil {
		t.Fatal(err)
	}
	doc := strings.Replace(files["index.html"], "</body>",
		`<img src="dist/added.custom"></body>`, 1)
	if err := os.WriteFile(
		filepath.Join(dir, "index.html"), []byte(doc), 0o644,
	); err != nil {
		t.Fatal(err)
	}
	prev = jsHash(t, wait(t))
	if err := os.WriteFile(added, []byte("edited image"), 0o644); err != nil {
		t.Fatal(err)
	}
	if hash := jsHash(t, wait(t)); hash == prev {
		t.Fatal("newly referenced image was not watched")
	} else {
		prev = hash
	}
	if err := os.Remove(filepath.Join(dir, "manifest.json")); err != nil {
		t.Fatal(err)
	}
	if result := wait(t); len(result.Errors) == 0 {
		t.Fatal("expected missing manifest error")
	}
	if err := os.WriteFile(
		filepath.Join(dir, "manifest.json"), []byte(files["manifest.json"]), 0o644,
	); err != nil {
		t.Fatal(err)
	}
	if hash := jsHash(t, wait(t)); hash == prev {
		t.Fatal("restored manifest did not change JavaScript")
	} else {
		prev = hash
	}
	// source directory membership changes trigger builds without HTML edits.
	unreferenced := filepath.Join(dir, "unreferenced.asset")
	if err := os.WriteFile(unreferenced, []byte("new asset"), 0o644); err != nil {
		t.Fatal(err)
	}
	if hash := jsHash(t, wait(t)); hash == prev {
		t.Fatal("source directory addition did not trigger a reload")
	} else {
		prev = hash
	}
	if err := os.Remove(unreferenced); err != nil {
		t.Fatal(err)
	}
	if hash := jsHash(t, wait(t)); hash == prev {
		t.Fatal("source directory removal did not trigger a reload")
	}
	// generated output names must not cause another build.
	if err := os.WriteFile(
		filepath.Join(out, "unreferenced.asset"), []byte("output"), 0o644,
	); err != nil {
		t.Fatal(err)
	}
	select {
	case result := <-builds:
		t.Fatalf("generated output triggered another build: %v", result.Errors)
	case <-time.After(500 * time.Millisecond):
	}
}

func TestHTMLPluginStableRebuilds(t *testing.T) {
	dir := t.TempDir()
	out := filepath.Join(dir, "dist")
	if err := os.Mkdir(out, 0o755); err != nil {
		t.Fatal(err)
	}
	entry := filepath.Join(dir, "index.html")
	for name, contents := range map[string]string{
		"index.html": `<script type="module" src="index.js"></script>`,
		"index.js":   `console.log("unchanged");`,
	} {
		if err := os.WriteFile(filepath.Join(dir, name), []byte(contents), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	config := &cliconfig.CLIConfig{
		Entries: []string{entry}, OutDir: out, WatchPort: 1234,
	}
	ctx, err := api.Context(api.BuildOptions{
		Bundle: true, Format: api.FormatESModule, Write: true,
		EntryPoints: []string{filepath.Join(dir, "index.js")},
		Outdir:      out, Sourcemap: api.SourceMapLinked,
		LogLevel: api.LogLevelSilent,
		Plugins:  []api.Plugin{HTMLPlugin(config)},
	})
	if err != nil {
		t.Fatal(err)
	}
	defer ctx.Dispose()
	if result := ctx.Rebuild(); len(result.Errors) != 0 {
		t.Fatal(result.Errors)
	}
	readJS := func(t *testing.T) []byte {
		t.Helper()
		bin, err := os.ReadFile(filepath.Join(out, "index.js"))
		if err != nil {
			t.Fatal(err)
		}
		return bin
	}
	t.Run("unchanged rebuild", func(t *testing.T) {
		before := readJS(t)
		if result := ctx.Rebuild(); len(result.Errors) != 0 {
			t.Fatal(result.Errors)
		}
		if !bytes.Equal(before, readJS(t)) {
			t.Fatal("unchanged rebuild changed JavaScript and would trigger a reload")
		}
	})
	t.Run("source map request", func(t *testing.T) {
		server, err := ctx.Serve(api.ServeOptions{
			Host: "127.0.0.1", Port: -1, Servedir: out,
		})
		if err != nil {
			t.Fatal(err)
		}
		before := readJS(t)
		// esbuild reuses builds for 250ms; DevTools can open much later.
		time.Sleep(300 * time.Millisecond)
		client := &http.Client{Timeout: 5 * time.Second}
		resp, err := client.Get(fmt.Sprintf(
			"http://127.0.0.1:%d/index.js.map", server.Port,
		))
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()
		if _, err := io.Copy(io.Discard, resp.Body); err != nil {
			t.Fatal(err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("source map response = %d", resp.StatusCode)
		}
		if !bytes.Equal(before, readJS(t)) {
			t.Fatal("source map request changed JavaScript and would trigger a reload")
		}
	})
}
