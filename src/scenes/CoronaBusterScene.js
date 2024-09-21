import Phaser, { Physics } from "phaser"
import FallingObject from "../ui/FallingObject"
import Laser from "../ui/Laser"

export default class CoronaBusterScene extends Phaser.Scene {
	constructor() {
		super("corona-buster-scene")
	}

	init() {
		this.clouds = undefined

		this.nav_left = false
		this.nav_right = false
		this.shoot = false
		this.keyDown = false

		this.player = undefined
		this.speed = 100

		this.cursor = undefined

		this.enemies = undefined
		this.enemySpeed = 50

		this.lasers = undefined
		this.lastFired = 10

		this.scoreLabel = undefined
		this.score = 0

		this.lifeLabel = undefined
		this.life = 3

		this.handsanitizer = undefined

		// this.backsound = undefined
		this.keyW = undefined
		this.keyA = undefined
		this.keyS = undefined
		this.keyD = undefined
	}

	preload() {
		this.load.image("background", "images/bg_layer1.png")
		this.load.image("cloud", "images/cloud.png")

		this.load.image("left", "images/left-btn.png")
		this.load.image("right", "images/right-btn.png")
		this.load.image("shoot", "images/shoot-btn.png")

		this.load.spritesheet("player", "images/ship.png", {
			frameWidth: 66,
			frameHeight: 66,
		})

		this.load.image("enemy", "images/enemy.png")

		this.load.spritesheet("laser", "images/laser-bolts.png", {
			frameWidth: 16,
			frameHeight: 16,
		})

		this.load.image("handsanitizer", "images/handsanitizer.png")

		// this.load.audio("bgsound", "sfx/AloneAgainst Enemy.ogg")
		this.load.audio("laser", "sfx/sfx_laser.ogg")
		this.load.audio("destroy", "sfx/destroy.mp3")
		this.load.audio("life", "sfx/handsanitizer.mp3")
		this.load.audio("gameover", "sfx/gameover.wav")
		this.load.audio("shipCrash", "sfx/hitEnemy.mp3")
	}

	create() {
		const gameWidth = this.scale.width * 0.5
		const gameHeight = this.scale.height * 0.5
		this.add.image(gameWidth, gameHeight, "background")

		this.clouds = this.physics.add.group({
			key: "cloud",
			repeat: 10,
		})

		Phaser.Actions.RandomRectangle(this.clouds.getChildren(), this.physics.world.bounds)

		this.createButtons()

		this.player = this.createPlayer()

		this.cursor = this.input.keyboard.createCursorKeys()
		this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A)
		this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S)
		this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D)
		this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W)

		this.enemies = this.physics.add.group({
			classType: FallingObject,
			maxSize: 10,
			runChildUpdate: true,
		})

		this.time.addEvent({
			delay: Phaser.Math.Between(1000, 5000),
			callback: this.spawnEnemy,
			callbackScope: this,
			loop: true,
		})

		this.lasers = this.physics.add.group({
			classType: Laser,
			maxSize: 10,
			runChildUpdate: true,
		})

		this.physics.add.overlap(this.lasers, this.enemies, this.hitEnemy, null, this)

		this.scoreLabel = this.add
			.text(10, 10, "Score", {
				fontSize: "16px",
				color: "black",
				backgroundColor: "white",
			})
			.setDepth(1)

		this.lifeLabel = this.add
			.text(10, 30, "Life", {
				fontSize: "16px",
				color: "black",
				backgroundColor: "white",
			})
			.setDepth(1)

		this.physics.add.overlap(this.player, this.enemies, this.decreaseLife, null, this)

		this.handsanitizer = this.physics.add.group({
			classType: FallingObject,
			runChildUpdate: true,
		})
		this.time.addEvent({
			delay: 10000,
			callback: this.spawnHandsanitizer,
			callbackScope: this,
			loop: true,
		})
		this.physics.add.overlap(this.player, this.handsanitizer, this.increaseLife, null, this)

		// this.backsound = this.sound.add("bgsound")
		// var soundConfig = {
		// 	loop: true,
		// 	volume: 0.5,
		// }
		// this.backsound.play(soundConfig)
	}

	update(time) {
		this.clouds.getChildren().forEach((child) => {
			child.body.velocity.y = 20 + Math.floor(Math.random() * 20)
			if (child.body.position.y > this.scale.height) {
				child.body.position.x = Phaser.Math.Between(5, 400)
				child.body.position.y = 0
			}
		})

		this.movePlayer(this.player, time)

		this.scoreLabel.setText("Score: " + this.score)
		this.lifeLabel.setText("Life: " + this.life)
	}

	createButtons() {
		this.input.addPointer(3)

		let shoot = this.add.image(320, 550, "shoot").setInteractive().setDepth(0.5).setAlpha(0.8).setScale(0.8)
		let nav_left = this.add.image(50, 500, "left").setInteractive().setDepth(0.5).setAlpha(0.8).setScale(0.8)
		let nav_right = this.add
			.image(nav_left.x + nav_left.displayWidth + 20, 500, "right")
			.setInteractive()
			.setDepth(0.5)
			.setAlpha(0.8)
			.setScale(0.8)

		nav_left.on(
			"pointerdown",
			() => {
				this.nav_left = true
			},
			this
		)

		nav_left.on(
			"pointerout",
			() => {
				this.nav_left = false
			},
			this
		)

		nav_right.on(
			"pointerdown",
			() => {
				this.nav_right = true
			},
			this
		)

		nav_right.on(
			"pointerout",
			() => {
				this.nav_right = false
			},
			this
		)

		shoot.on(
			"pointerdown",
			() => {
				this.shoot = true
			},
			this
		)

		shoot.on(
			"pointerout",
			() => {
				this.shoot = false
			},
			this
		)
	}

	createPlayer() {
		const player = this.physics.add.sprite(200, 450, "player")
		player.setCollideWorldBounds(true)

		this.anims.create({
			key: "turn",
			frames: [
				{
					key: "player",
					frame: 0,
				},
			],
		})

		this.anims.create({
			key: "left",
			frames: this.anims.generateFrameNumbers("player", {
				start: 1,
				end: 2,
			}),
		})

		this.anims.create({
			key: "right",
			frames: this.anims.generateFrameNumbers("player", {
				start: 1,
				end: 2,
			}),
		})
		return player
	}

	movePlayer(player, time) {
		player.setVelocityX(0)
		player.setVelocityY(0)
		player.anims.play("turn")
		if (this.cursor.up.isDown || this.keyW.isDown) {
			player.setVelocityY(this.speed * -1)
			player.anims.play("turn")
		}
		if (this.cursor.down.isDown || this.keyS.isDown) {
			player.setVelocityY(this.speed)
			player.anims.play("turn")
		}
		if (this.cursor.left.isDown || this.keyA.isDown) {
			player.setVelocityX(this.speed * -1)
			player.anims.play("left", true)
			player.setFlipX(false)
		}
		if (this.cursor.right.isDown || this.keyD.isDown) {
			player.setVelocityX(this.speed)
			player.anims.play("right", true)
			player.setFlipX(true)
		}

		// if (this.nav_left || this.cursor.left.isDown || this.keyA.isDown) {
		// 	player.setVelocityX(this.speed * -1)
		// 	player.anims.play("left", true)
		// 	player.setFlipX(false)
		// } else if (this.nav_right || this.cursor.right.isDown || this.keyD.isDown) {
		// 	player.setVelocityX(this.speed)
		// 	player.anims.play("right", true)
		// 	player.setFlipX(true)
		// } else if (this.cursor.up.isDown || this.keyW.isDown) {
		// 	player.setVelocityY(this.speed * -1)
		// 	player.anims.play("turn")
		// } else if (this.cursor.down.isDown || this.keyS.isDown) {
		// 	player.setVelocityY(this.speed)
		// 	player.anims.play("turn")
		// } else {
		// 	player.setVelocityX(0)
		// 	player.setVelocityY(0)
		// 	player.anims.play("turn")
		// }

		if ((this.shoot || this.cursor.space.isDown) && time > this.lastFired) {
			const laser = this.lasers.get(0, 0, "laser")
			if (laser) {
				laser.fire(this.player.x, this.player.y)
				this.lastFired = time + 150

				this.sound.play("laser")
			}
		}
	}

	spawnEnemy() {
		const config = {
			speed: 30,
			rotation: 0.1,
		}

		// @ts-ignore
		const enemy = this.enemies.get(0, 0, "enemy", config)
		const positionX = Phaser.Math.Between(50, 350)
		if (enemy) {
			enemy.spawn(positionX)
		}
	}

	hitEnemy(laser, enemy) {
		laser.die()
		enemy.die()
		this.score += 10

		this.sound.play("destroy")
	}

	decreaseLife(player, enemy) {
		enemy.die()
		this.life--
		this.sound.play("shipCrash")
		if (this.life == 2) {
			player.setTint(0xff0000)
		} else if (this.life == 1) {
			player.setTint(0xff0000).setAlpha(0.2)
		} else if (this.life == 0) {
			this.sound.stopAll()
			this.sound.play("gameover")
			this.scene.start("over-scene", { score: this.score })
		}
	}

	spawnHandsanitizer() {
		const config = {
			speed: 60,
			rotation: 0,
		}

		// @ts-ignore
		const handsanitizer = this.handsanitizer.get(0, 0, "handsanitizer", config)
		const positionX = Phaser.Math.Between(70, 330)
		if (handsanitizer) {
			handsanitizer.spawn(positionX)
		}
	}

	increaseLife(player, handsanitizer) {
		handsanitizer.die()
		this.life++
		if (this.life >= 3) {
			player.clearTint().setAlpha(1)
		} else if (this.life == 2) {
			player.setTint(0x00ff00)
		} else if (this.life == 1) {
			player.setTint(0xffff00)
		}

		this.sound.play("life")
	}
}
