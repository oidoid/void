package plugins

import (
	"fmt"
	"os"
	"os/exec"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/oidoid/void/src/cmd/pack/cliconfig"
)

type shaderMinifier func(string) (string, error)

func GLSLPlugin(config *cliconfig.CLIConfig) api.Plugin {
	return glslPlugin(config, minifyGLSL)
}

func glslPlugin(
	config *cliconfig.CLIConfig,
	minify shaderMinifier,
) api.Plugin {
	return api.Plugin{
		Name: "GLSLPlugin",
		Setup: func(build api.PluginBuild) {
			build.OnLoad(
				api.OnLoadOptions{Filter: `\.glsl$`},
				func(args api.OnLoadArgs) (api.OnLoadResult, error) {
					return loadGLSL(config, args.Path, minify), nil
				},
			)
		},
	}
}

func loadGLSL(
	config *cliconfig.CLIConfig,
	filename string,
	minify shaderMinifier,
) api.OnLoadResult {
	var glsl string
	if config.Minify {
		var err error
		glsl, err = minify(filename)
		if err != nil {
			return errorLoadResult(err)
		}
	} else {
		bin, err := os.ReadFile(filename)
		if err != nil {
			return errorLoadResult(err)
		}
		glsl = string(bin)
	}
	return api.OnLoadResult{
		Contents:   &glsl,
		Loader:     api.LoaderText,
		WatchFiles: []string{filename},
	}
}

func minifyGLSL(filename string) (string, error) {
	minifier, err := exec.LookPath("shader_minifier.exe")
	if err != nil {
		return "", fmt.Errorf("find shader_minifier.exe: %w", err)
	}
	cmd := exec.Command(
		"mono",
		minifier,
		"--aggressive-inlining",
		"--format", "text",
		"--preserve-externals",
		"--no-overloading",
		"-o", "-",
		filename,
	)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("minify %s: %w\n%s", filename, err, out)
	}
	return string(out), nil
}
