package cliconfig

import (
	"encoding/json"
	"os"
	"regexp"
)

type CLIConfig struct {
	Conditions       []string
	Entries          []string
	Minify           bool
	OneFile          bool
	OutDir           string
	TsconfigFilename string
	// 0 means unset.
	WatchPort int
}

type tsconfig struct {
	CompilerOptions struct {
		CustomConditions []string
	}
}

var (
	jsoncCommentRe       = regexp.MustCompile(`("(?:\\.|[^"\\])*")|//[^\r\n]*`)
	jsoncTrailingCommaRe = regexp.MustCompile(`,(\s*[}\]])`)
)

func NewCLIConfig(argv Argv) (*CLIConfig, error) {
	tsconfig, err := readTsconfig(argv.TsconfigFilename)
	if err != nil {
		return nil, err
	}
	conditions := tsconfig.CompilerOptions.CustomConditions

	return &CLIConfig{
		Conditions:       conditions,
		Entries:          argv.Entries,
		Minify:           argv.Minify,
		OneFile:          argv.OneFile,
		OutDir:           argv.OutDir,
		TsconfigFilename: argv.TsconfigFilename,
		WatchPort:        argv.Watch.port,
	}, nil
}

func readTsconfig(filename string) (*tsconfig, error) {
	bin, err := os.ReadFile(filename)
	if err != nil {
		return nil, err
	}
	var tsconfig tsconfig
	if err := json.Unmarshal(stripJSONC(bin), &tsconfig); err != nil {
		return nil, err
	}
	return &tsconfig, nil
}

func stripJSONC(bin []byte) []byte {
	bin = jsoncCommentRe.ReplaceAllFunc(bin, func(match []byte) []byte {
		if match[0] == '"' {
			return match
		}
		return nil
	})
	return jsoncTrailingCommaRe.ReplaceAll(bin, []byte("$1"))
}
