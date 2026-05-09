package plugins

import (
	"encoding/base64"
	"encoding/json"
	"mime"
	"os"
	"path/filepath"
	"strings"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/oidoid/void/src/cmd/pack/cliconfig"
	"github.com/oidoid/void/src/cmd/pack/htmlparser"
	"golang.org/x/net/html"
)

func HTMLPlugin(config *cliconfig.CLIConfig) api.Plugin {
	return api.Plugin{
		Name: "HTMLPlugin",
		Setup: func(build api.PluginBuild) {
			build.OnEnd(func(result *api.BuildResult) (api.OnEndResult, error) {
				if len(result.Errors) > 0 {
					return api.OnEndResult{}, nil
				}
				for _, entry := range config.Entries {
					if filepath.Ext(entry) != ".html" {
						continue
					}
					if result := transformHTML(config, entry, filepath.Dir(entry)); len(result.Errors) > 0 {
						return result, nil
					}
				}
				return api.OnEndResult{}, nil
			})
		},
	}
}

func transformHTML(config *cliconfig.CLIConfig, entry, entryDir string) api.OnEndResult {
	doc, err := htmlparser.ParseDoc(entry)
	if err != nil {
		return errorEndResult(err)
	}
	if result := transformFavicons(doc, config, entryDir); len(result.Errors) > 0 {
		return result
	}
	if result := transformImages(doc, config, entryDir); len(result.Errors) > 0 {
		return result
	}
	if result := transformManifests(doc, config, entryDir); len(result.Errors) > 0 {
		return result
	}
	if result := transformScripts(doc, config); len(result.Errors) > 0 {
		return result
	}
	if result := transformStylesheets(doc, config); len(result.Errors) > 0 {
		return result
	}
	filename := filepath.Join(config.OutDir, filepath.Base(entry))
	file, err := os.Create(filename)
	if err != nil {
		return errorEndResult(err)
	}
	defer file.Close()
	if err := html.Render(file, doc); err != nil {
		return errorEndResult(err)
	}
	return api.OnEndResult{}
}

func transformFavicons(doc *html.Node, config *cliconfig.CLIConfig, entryDir string) api.OnEndResult {
	for _, node := range htmlparser.QueryTag(doc, "link") {
		rel := htmlparser.NodeAttr(node, "rel")
		if rel != "icon" {
			continue
		}
		href := htmlparser.NodeAttr(node, "href")
		if href == "" {
			continue
		}
		src, err := transformImageSrc(config, entryDir, href)
		if err != nil {
			return errorEndResult(err)
		}
		htmlparser.SetNodeAttr(node, "href", src)
	}
	return api.OnEndResult{}
}

func transformImages(doc *html.Node, config *cliconfig.CLIConfig, entryDir string) api.OnEndResult {
	for _, node := range htmlparser.QueryTag(doc, "img") {
		src := htmlparser.NodeAttr(node, "src")
		if src == "" {
			continue
		}
		newSrc, err := transformImageSrc(config, entryDir, src)
		if err != nil {
			return errorEndResult(err)
		}
		htmlparser.SetNodeAttr(node, "src", newSrc)
	}
	return api.OnEndResult{}
}

func transformImageSrc(config *cliconfig.CLIConfig, entryDir, src string) (string, error) {
	filename := filepath.Base(src)
	bin, err := os.ReadFile(filepath.Join(entryDir, src))
	if err != nil {
		return "", err
	}
	if config.OneFile {
		mimeType := mime.TypeByExtension(strings.ToLower(filepath.Ext(filename)))
		if mimeType == "" {
			mimeType = "application/octet-stream"
		}
		return "data:" + mimeType + ";base64," + base64.StdEncoding.EncodeToString(bin), nil
	}
	if err := os.WriteFile(filepath.Join(config.OutDir, filename), bin, 0o644); err != nil {
		return "", err
	}
	return filename, nil
}

func transformManifests(doc *html.Node, config *cliconfig.CLIConfig, entryDir string) api.OnEndResult {
	for _, node := range htmlparser.QueryTag(doc, "link") {
		if htmlparser.NodeAttr(node, "rel") != "manifest" {
			continue
		}
		href := htmlparser.NodeAttr(node, "href")
		if href == "" {
			continue
		}
		filename := filepath.Base(href)
		srcBin, err := os.ReadFile(filepath.Join(entryDir, href))
		if err != nil {
			return errorEndResult(err)
		}

		var manifest map[string]any
		if err := json.Unmarshal(srcBin, &manifest); err != nil {
			return errorEndResult(err)
		}
		if icons, ok := manifest["icons"].([]any); ok {
			for _, item := range icons {
				icon, ok := item.(map[string]any)
				if !ok {
					continue
				}
				iconSrc := icon["src"].(string)
				if iconSrc == "" {
					continue
				}
				newSrc, err := transformImageSrc(config, entryDir, iconSrc)
				if err != nil {
					return errorEndResult(err)
				}
				icon["src"] = newSrc
			}
		}

		// to-do:
		// if (config.bundle.version) manifest.version = config.bundle.version
		// if (config.watch)
		//   manifest.start_url = `http://localhost:${config.port}`

		manifestBin, err := json.Marshal(manifest)
		if err != nil {
			return errorEndResult(err)
		}
		if config.OneFile {
			dataURI := "data:application/manifest+json;base64," + base64.StdEncoding.EncodeToString(manifestBin)
			htmlparser.SetNodeAttr(node, "href", dataURI)
			continue
		}
		if err := os.WriteFile(filepath.Join(config.OutDir, filename), manifestBin, 0o644); err != nil {
			return errorEndResult(err)
		}
		htmlparser.SetNodeAttr(node, "href", filename)
	}
	return api.OnEndResult{}
}

func transformScripts(doc *html.Node, config *cliconfig.CLIConfig) api.OnEndResult {
	for _, node := range htmlparser.QueryTag(doc, "script") {
		src := htmlparser.NodeAttr(node, "src")
		if src == "" || htmlparser.NodeAttr(node, "type") != "module" {
			continue
		}
		filename := filepath.Base(src)
		if strings.HasSuffix(filename, ".ts") {
			filename = filename[:len(filename)-3] + ".js"
		}

		if config.OneFile {
			bin, err := os.ReadFile(filepath.Join(config.OutDir, filename))
			if err != nil {
				return errorEndResult(err)
			}
			htmlparser.RemoveNodeAttr(node, "src")
			htmlparser.SetTextContent(node, string(bin))
			continue
		}

		htmlparser.SetNodeAttr(node, "src", filename)
	}
	return api.OnEndResult{}
}

func transformStylesheets(doc *html.Node, config *cliconfig.CLIConfig) api.OnEndResult {
	for _, node := range htmlparser.QueryTag(doc, "link") {
		if htmlparser.NodeAttr(node, "rel") != "stylesheet" {
			continue
		}
		href := htmlparser.NodeAttr(node, "href")
		if href == "" {
			continue
		}
		filename := filepath.Base(href)

		bin, err := os.ReadFile(filepath.Join(config.OutDir, filename))
		if err != nil {
			return errorEndResult(err)
		}
		if config.OneFile {
			styleNode := &html.Node{Type: html.ElementNode, Data: "style"}
			htmlparser.SetTextContent(styleNode, string(bin))
			htmlparser.ReplaceNode(node, styleNode)
			continue
		}
		htmlparser.SetNodeAttr(node, "href", filename)
	}
	return api.OnEndResult{}
}
