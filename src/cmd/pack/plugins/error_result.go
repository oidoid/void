package plugins

import "github.com/evanw/esbuild/pkg/api"

func errorEndResult(err error) api.OnEndResult {
	return api.OnEndResult{Errors: []api.Message{{Text: err.Error()}}}
}

func errorLoadResult(err error) api.OnLoadResult {
	return api.OnLoadResult{Errors: []api.Message{{Text: err.Error()}}}
}
