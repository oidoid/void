package schemas

import (
	_ "embed"
	"encoding/json"
)

type VoidConfig struct {
	Entry string
	Out   *struct {
		Dir  string
		Meta string
	}
	Tsconfig string
}

type voidSchema struct {
	Properties struct {
		Entry    struct{ Default string }
		Tsconfig struct{ Default string }
		Out      struct {
			Properties struct {
				Dir  struct{ Default string }
				Meta struct{ Default string }
			}
		}
	}
}

//go:embed void.v0.json
var VoidSchemaBytes []byte
var schema voidSchema

func UnmarshalVoidConfig(jsonStr []byte) (*VoidConfig, error) {
	config := &VoidConfig{
		Entry:    schema.Properties.Entry.Default,
		Tsconfig: schema.Properties.Tsconfig.Default,
	}
	if err := json.Unmarshal(jsonStr, config); err != nil {
		return nil, err
	}
	if config.Out != nil {
		if config.Out.Dir == "" {
			config.Out.Dir = schema.Properties.Out.Properties.Dir.Default
		}
		if config.Out.Meta == "" {
			config.Out.Meta = schema.Properties.Out.Properties.Meta.Default
		}
	}
	return config, nil
}

func init() {
	if err := json.Unmarshal(VoidSchemaBytes, &schema); err != nil {
		panic(err)
	}
}
