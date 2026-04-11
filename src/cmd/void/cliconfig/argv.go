package cliconfig

import (
	"flag"
)

type Argv struct {
	// void.json path relative to CWD.
	configFilename string
	minify         bool
	oneFile        bool
	watch          watchFlag
}

func NewArgv() Argv {
	argv := Argv{}
	flag.StringVar(&argv.configFilename, "config", "void.json", "path to void config file")
	flag.Var(&argv.watch, "watch", "live reload on http://localhost:port (default port 1234)")
	flag.BoolVar(&argv.minify, "minify", false, "minify output")
	flag.BoolVar(&argv.oneFile, "one-file", false, "inline everything into a single HTML file")
	flag.Parse()
	return argv
}
