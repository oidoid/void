package vgame

import "github.com/oidoid/void/src/void/vinput"

type Game interface {
	Platform
	Input() *vinput.Input
}
