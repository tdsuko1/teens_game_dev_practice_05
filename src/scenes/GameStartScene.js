import Phaser from "phaser"

export default class GameStartScene extends Phaser.Scene {
	constructor() {
		super("game-start-scene")
	}

	init() {
		this.backsound = undefined
	}

	preload() {
		this.load.image("background", "images/bg_layer1.png")
		this.load.image("gamestart", "images/gamestart.png")
		this.load.image("start-btn", "images/start-btn.png")

		this.load.audio("bgsound", "sfx/AloneAgainst Enemy.ogg")
	}

	create() {
		this.add.image(200, 320, "background")
		this.add.image(200, 200, "gamestart")
		this.startButton = this.add.image(200, 400, "start-btn").setInteractive().setScale(0.5)

		this.startButton.once(
			"pointerup",
			() => {
				this.sound.stopByKey("bgsound")
				this.scene.start("corona-buster-scene")
			},
			this
		)

		this.backsound = this.sound.add("bgsound")
		var soundConfig = {
			loop: true,
			volume: 0.5,
		}
		// this.backsound.play(soundConfig)

		if (this.sound.locked) {
			var text = this.add.text(10, 10, "Tap to unlock audio", { font: "16px Courier", color: "#00ff00" })

			this.sound.once(
				"unlocked",
				function () {
					text.destroy()
					this.backsound.play(soundConfig)
				},
				this
			)
		} else {
			this.backsound.play(soundConfig)
		}
	}
}
