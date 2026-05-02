package game

import (
	"unsafe"

	"github.com/oidoid/void/src/demo/ents"
	"github.com/oidoid/void/src/demo/levels"
	"github.com/oidoid/void/src/void/vents"
	"github.com/oidoid/void/src/void/vgame"
	"github.com/oidoid/void/src/void/vmem/vvec"
)

type Game struct {
	*vgame.Engine
	balls vvec.Vec[ents.BallEnt]
	ents  vents.Zoo[Game]
	level func(*Game) vgame.Status
}

var version string

func New() *Game {
	this := &Game{
		Engine: vgame.New(&vgame.EngineOpts{
			MaxSprites: 2 * 1024 * 1024,
		}),
		balls: vvec.New[ents.BallEnt](2 * 1024 * 1024),
	}
	this.Level = &levels.InitLevel
	return this
}

func (this *Game) Balls() *vvec.Vec[ents.BallEnt] {
	return &this.balls
}

func (this *Game) RegisterUpdate(update func(*Game)) {
	this.ents.Register(update)
}

// to-do: level manager.
func (this *Game) SetLevel(hook func(*Game) vgame.Status) {
	this.level = hook
}

func (this *Game) TilePointer() uintptr {
	return uintptr(unsafe.Pointer(&levels.InitLevel.Tiles[0]))
}

func (this *Game) TileCount() uint32 {
	return uint32(len(levels.InitLevel.Tiles))
}

// to-do: move to vlevels.Level.
func (this *Game) LevelTileW() uint8 { return levels.InitLevel.Tile.W }
func (this *Game) LevelTileH() uint8 { return levels.InitLevel.Tile.H }

// to-do: separate method for resizing cam or whatever.
func (this *Game) Update() vgame.Status {
	var stat = this.Engine.Update()
	if this.level != nil {
		stat |= this.level(this)
	}
	return stat
}

func (this *Game) Ents() *vents.Zoo[Game] {
	return &this.ents
}

func init() { println(version) }
