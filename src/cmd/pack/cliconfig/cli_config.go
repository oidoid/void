package cliconfig

import (
	"bytes"
	"encoding/json"
	"regexp"

	"os"
	"path/filepath"

	"github.com/oidoid/void/schemas"
	"github.com/santhosh-tekuri/jsonschema/v6"
)

type CLIConfig struct {
	// void.json dir.
	ConfigDir        string
	Conditions       []string
	Entry            string
	EntryDir         string
	MetaFilename     string
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
	void, err := readVoidConfig(argv.configFilename)
	if err != nil {
		return nil, err
	}

	configDir := filepath.Dir(argv.configFilename)
	outDir := filepath.Join(configDir, void.Out.Dir)

	var tsconfigFilename string
	var conditions []string
	if void.Tsconfig != "" {
		tsconfigFilename = filepath.Join(configDir, void.Tsconfig)
		tsconfig, err := readTsconfig(tsconfigFilename)
		if err != nil {
			return nil, err
		}
		conditions = tsconfig.CompilerOptions.CustomConditions
	}

	var metaFilename string
	if void.Out.Meta != "" {
		metaFilename = filepath.Join(outDir, void.Out.Meta)
	}

	return &CLIConfig{
		ConfigDir:        configDir,
		Conditions:       conditions,
		Entry:            filepath.Join(configDir, void.Entry),
		EntryDir:         filepath.Join(configDir, filepath.Dir(void.Entry)),
		MetaFilename:     metaFilename,
		Minify:           argv.minify,
		OneFile:          argv.oneFile,
		OutDir:           outDir,
		TsconfigFilename: tsconfigFilename,
		WatchPort:        argv.watch.port,
	}, nil
}

func readTsconfig(filename string) (*tsconfig, error) {
	jsonStr, err := os.ReadFile(filename)
	if err != nil {
		return nil, err
	}
	var tsconfig tsconfig
	if err := json.Unmarshal(stripJSONC(jsonStr), &tsconfig); err != nil {
		return nil, err
	}
	return &tsconfig, nil
}

func readVoidConfig(filename string) (*schemas.VoidConfig, error) {
	jsonStr, err := os.ReadFile(filename)
	if err != nil {
		return nil, err
	}
	if err := validateVoidJSON(jsonStr); err != nil {
		return nil, err
	}

	config, err := schemas.UnmarshalVoidConfig(jsonStr)
	if err != nil {
		return nil, err
	}

	return config, nil
}

func stripJSONC(jsonStr []byte) []byte {
	jsonStr = jsoncCommentRe.ReplaceAllFunc(jsonStr, func(match []byte) []byte {
		if match[0] == '"' {
			return match
		}
		return nil
	})
	return jsoncTrailingCommaRe.ReplaceAll(jsonStr, []byte("$1"))
}

func validateVoidJSON(jsonStr []byte) error {
	jsonAny, err := jsonschema.UnmarshalJSON(bytes.NewReader(jsonStr))
	if err != nil {
		return err
	}
	schemaAny, err := jsonschema.UnmarshalJSON(bytes.NewReader(schemas.VoidSchemaBytes))
	if err != nil {
		return err
	}
	cc := jsonschema.NewCompiler()
	if err := cc.AddResource("void.v0.json", schemaAny); err != nil {
		return err
	}
	schema, err := cc.Compile("void.v0.json")
	if err != nil {
		return err
	}
	return schema.Validate(jsonAny)
}
