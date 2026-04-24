package engine

import (
	"unsafe"

	"github.com/oidoid/void/src/demo/game"
	"github.com/oidoid/void/src/demo/levels"
	"github.com/oidoid/void/src/void/vengine"
	"github.com/oidoid/void/src/void/vents"
	"github.com/oidoid/void/src/void/vgame"
)

type Engine struct {
	*vengine.Engine
	balls *vents.Zoo[game.Game]
}

var _ game.Game = (*Engine)(nil)
var version string

func NewEngine() Engine {
	eng := Engine{Engine: vengine.NewEngine(), balls: vents.NewZoo[game.Game](1024 * 1024)}
	eng.Level = &levels.InitLevel
	return eng
}

func (this *Engine) Balls() *vents.Zoo[game.Game] {
	return this.balls
}

func (this *Engine) SpritePointer() uintptr {
	return this.balls.SpritePointer()
}

func (this *Engine) SpriteCount() int {
	return this.balls.SpriteCount()
}

func (this *Engine) TilePointer() uintptr {
	return uintptr(unsafe.Pointer(&levels.InitLevel.Tiles[0]))
}

func (this *Engine) TileCount() uint32 {
	return uint32(len(levels.InitLevel.Tiles))
}

func (this *Engine) LevelTileW() uint8 { return levels.InitLevel.Tile.W }
func (this *Engine) LevelTileH() uint8 { return levels.InitLevel.Tile.H }

func (this *Engine) Update() vgame.Status {
	var stat = this.Engine.Update()
	stat |= levels.Update(this)
	return stat
}

func init() { println(version) }
