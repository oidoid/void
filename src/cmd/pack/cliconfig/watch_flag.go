package cliconfig

import (
	"strconv"
)

type watchFlag struct {
	// 0 is unset.
	port int
}

func (this *watchFlag) IsBoolFlag() bool { return true }

func (this *watchFlag) Set(str string) error {
	if str == "true" {
		this.port = 1234
		return nil
	}
	port, err := strconv.Atoi(str)
	if err != nil {
		return err
	}
	this.port = port
	return nil
}

func (this *watchFlag) String() string {
	if this.port == 0 {
		return ""
	}
	return strconv.Itoa(this.port)
}
