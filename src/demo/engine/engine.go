package engine

import (
	"unsafe"

	"github.com/oidoid/void/src/demo/ents"
	"github.com/oidoid/void/src/demo/game"
	"github.com/oidoid/void/src/demo/levels"
	"github.com/oidoid/void/src/void/vengine"
	"github.com/oidoid/void/src/void/vents"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

type Engine struct {
	*vengine.Engine
	balls vvec.Vec[ents.BallEnt]
	zoo   vents.Zoo[game.Game]
}

var _ game.Game = (*Engine)(nil)
var version string

const MaxSpriteRadius = 16

func New() *Engine {
	this := &Engine{
		Engine: vengine.New(&vengine.EngineOpts{
			MaxSprites: 2 * 1024 * 1024,
		}),
		balls: vvec.New[ents.BallEnt](2 * 1024 * 1024),
	}
	this.zoo.Register(func(gam game.Game) {
		// to-do: how can i pass just `this`?
		ents.UpdateBalls(gam.Balls(), gam.Sprites(),
			float32(gam.LevelX()), float32(gam.LevelY()),
			float32(gam.LevelX())+float32(gam.LevelW()),
			float32(gam.LevelY())+float32(gam.LevelH()),
			gam.CamX()-MaxSpriteRadius, gam.CamY()-MaxSpriteRadius,
			gam.CamX()+float32(gam.Canvas().W)+MaxSpriteRadius,
			gam.CamY()+float32(gam.Canvas().H)+MaxSpriteRadius,
		)
	})
	this.Level = &levels.InitLevel
	return this
}

func (this *Engine) Balls() *vvec.Vec[ents.BallEnt] {
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

func (this *Engine) Update() vgame.Status {
	var stat = this.Engine.Update()
	stat |= levels.Update(this)
	return stat
}

func (this *Engine) Zoo() *vents.Zoo[game.Game] {
	return &this.zoo
}

func init() { println(version) }
