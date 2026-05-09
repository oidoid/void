package cliconfig

import (
	"encoding/json"
	"regexp"

	"os"
)

type CLIConfig struct {
	// void.json dir.
	// ConfigDir        string
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
	// void, err := readVoidConfig(argv.configFilename)
	// if err != nil {
	// 	return nil, err
	// }

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

// func readVoidConfig(filename string) (*schemas.VoidConfig, error) {
// 	bin, err := os.ReadFile(filename)
// 	if err != nil {
// 		return nil, err
// 	}
// 	if err := validateVoidJSON(bin); err != nil {
// 		return nil, err
// 	}

// 	config, err := schemas.UnmarshalVoidConfig(bin)
// 	if err != nil {
// 		return nil, err
// 	}

// 	return config, nil
// }

func stripJSONC(bin []byte) []byte {
	bin = jsoncCommentRe.ReplaceAllFunc(bin, func(match []byte) []byte {
		if match[0] == '"' {
			return match
		}
		return nil
	})
	return jsoncTrailingCommaRe.ReplaceAll(bin, []byte("$1"))
}

// func validateVoidJSON(jsonStr []byte) error {
// 	jsonAny, err := jsonschema.UnmarshalJSON(bytes.NewReader(jsonStr))
// 	if err != nil {
// 		return err
// 	}
// 	schemaAny, err := jsonschema.UnmarshalJSON(bytes.NewReader(schemas.VoidSchemaBytes))
// 	if err != nil {
// 		return err
// 	}
// 	cc := jsonschema.NewCompiler()
// 	if err := cc.AddResource("void.v0.json", schemaAny); err != nil {
// 		return err
// 	}
// 	schema, err := cc.Compile("void.v0.json")
// 	if err != nil {
// 		return err
// 	}
// 	return schema.Validate(jsonAny)
// }
