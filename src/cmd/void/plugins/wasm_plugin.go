package plugins

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/oidoid/void/src/cmd/void/cliconfig"
)

// if one-file, inline as data URI. otherwise, update URL to out dir relative
// file.
func WasmPlugin(config *cliconfig.CLIConfig) api.Plugin {
	return api.Plugin{
		Name: "WasmPlugin",
		Setup: func(build api.PluginBuild) {
			build.OnLoad(api.OnLoadOptions{Filter: `\.wasm$`}, func(args api.OnLoadArgs) (api.OnLoadResult, error) {
				var uri string
				if config.OneFile {
					wasm, err := os.ReadFile(args.Path)
					if err != nil {
						return errorLoadResult(err), nil
					}
					uri = "data:application/wasm;base64," + base64.StdEncoding.EncodeToString(wasm)
				} else {
					outDir, err := filepath.Abs(config.OutDir)
					if err != nil {
						return errorLoadResult(err), nil
					}
					relative, err := filepath.Rel(outDir, args.Path)
					if err != nil {
						return errorLoadResult(err), nil
					}
					uri = "./" + filepath.ToSlash(relative)
				}
				contents := fmt.Sprintf("export default %q", uri)
				return api.OnLoadResult{Contents: &contents, Loader: api.LoaderJS}, nil
			})
		},
	}
}
