package engine

import (
	"unsafe"

	"github.com/oidoid/void/src/demo/ents/entdata"
	"github.com/oidoid/void/src/demo/ents/enthooks"
	"github.com/oidoid/void/src/demo/game"
	"github.com/oidoid/void/src/demo/levels"
	"github.com/oidoid/void/src/void/vengine"
	"github.com/oidoid/void/src/void/vents"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

type Engine struct {
	*vengine.Engine
	balls vvec.Vec[entdata.BallEnt]
	zoo   vents.Zoo[game.Game]
}

var _ game.Game = (*Engine)(nil)
var version string

func New() *Engine {
	this := &Engine{
		Engine: vengine.New(&vengine.EngineOpts{
			MaxSprites: 2 * 1024 * 1024,
		}),
		balls: vvec.New[entdata.BallEnt](2 * 1024 * 1024),
	}
	this.zoo.Register(enthooks.UpdateBalls)
	this.Level = &levels.InitLevel
	return this
}

func (this *Engine) Balls() *vvec.Vec[entdata.BallEnt] {
	return &this.balls
}

func (this *Engine) TilePointer() uintptr {
	return uintptr(unsafe.Pointer(&levels.InitLevel.Tiles[0]))
}

func (this *Engine) TileCount() uint32 {
	return uint32(len(levels.InitLevel.Tiles))
}

func (this *Engine) LevelTileW() uint8 { return levels.InitLevel.Tile.W }
func (this *Engine) LevelTileH() uint8 { return levels.InitLevel.Tile.H }

// to-do: separate method for resizing cam or whatever.
func (this *Engine) Update() vgame.Status {
	var stat = this.Engine.Update()
	stat |= levels.Update(this)
	return stat
}

func (this *Engine) Zoo() *vents.Zoo[game.Game] {
	return &this.zoo
}

func init() { println(version) }
