package veng

type FullscreenReq uint8

const (
	FullscreenReqNone FullscreenReq = iota
	FullscreenReqExit
	FullscreenReqEnter
	FullscreenReqPortrait
	FullscreenReqLandscape
)
