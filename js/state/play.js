"use strict";

// game states
var stateSTART = null,
	stateRUNNING = null,
	stateEND = null,
	stateCLICKED = null,
	stateGAMEOVER = null;

// constants
var FONT_NAME = "TappyFont";
var ROCK_VELOCITY = 250;
var JUMP_VELOCITY = 500;
var GRAVITY = 1700;
var ENABLE_ENEMY = false;

// game vars
var game = null;
var prevRockPositions = [];
var score = 0;
var bestScore = 0;
var medal = null;

var starArray = ["starGold", "starSilver", "starBronze"];
var medalArray = ["medalGold", "medalSilver", "medalBronze"];
var envArray = ["Ice", "Grass", "Snow"];


var jumpSound = null;
var collectSound = null;
var gameOverSound = null;



/*
> fix : font issue [DONE]
> simplify the code
> change meaning full : method names
> code refactor
> check the more complicated loops

*/ 


window.Tplane.state.play = {
	
	
	preload: function(){
		// set global game object
		game = this.game;
		
		// load sounds
		game.load.audio('jump', 'jump.mp3');
		game.load.audio('gameOver', 'game_over1.mp3');
		game.load.audio('collect', 'collect.mp3');
	},
	
	create: function(){
		try {
			bestScore = localStorage.getItem("score") == null ? 0 : localStorage.getItem("score");
		} catch (e) {
			// localStorage is not availble or accessible
		}
		
		// add bacground and scale and make it fit to the screen
		this.bg = game.add.tileSprite(0, 0, 600, 800, "/background.png");
		this.bg.tileScale.y = 1.5;
		
		// add the score to screen and setup font and size
		this.scoreText = mt.create("ScoreText");
		this.scoreText.font = FONT_NAME;
		this.scoreText.fontSize = 50;
		
		
		// if we need to make it fullscreen
		game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
		//game.input.onDown.add(this.goFullscreen, this);
		
		// init the sound
		jumpSound = game.add.audio('jump');
		collectSound = game.add.audio('collect');
		gameOverSound = game.add.audio('gameOver');		
				
		// add obstacles
		this.rocks = mt.create("RocksGroup");			
		
		// add player and apply frame animation
		this.plane = mt.create("plane");
		this.plane.animations.add("fly", [28, 29, 30], 12, true);
		
		// add enemy, animation with other properties
		this.enemy = mt.create("plane");
		this.enemy.body.allowGravity = false;
		this.enemy.body.collideWorldBounds = false;		
		this.enemy.frameName = "planeRed1";
		this.enemy.scaleX = -1;
		// red animation frames -> 25, 26, 27
		this.enemy.animations.add("fly", [25, 26, 27], 12, true);
		this.enemy.animations.play("fly");		
		this.enemy.position.x = 700;
		
		
		// add game over UI
		this.gameOverUI = mt.create("GameOverUI");
		this.gameOverUI.setAll('alpha', 0); // hide game over ui
		
		// add intro UI
		this.introUI = mt.create("IntroUI");		
		
		// add main game click event
		game.input.onDown.add(function() {
			
			if(!stateRUNNING && !stateGAMEOVER){
				stateSTART = true;
				stateRUNNING = true;
			}
			
			stateCLICKED = true;
			
		});
		
		
		// add intro animations to plane and tap		
		var tap = this.introUI.mt.children.tap;
				
		// add player intro anmation
		mt.createTweens(this.plane);
		this.planeAnim = this.plane.mt.movies.introPlaneMove;
		this.showIntroAnim();
		
		
		// add tap animation
		var tapped = true;
		game.time.events.loop(Phaser.Timer.SECOND, function() {
			if(tapped){
				tap.frameName = "tapTick";
			}
			else{
				tap.frameName = "tap";
			}
			
			tapped = !tapped;			
			
		}, this);
		
		// small fix : change z index of sprite frames
		game.world.swap(this.scoreText, this.rocks);
		
		
		// change font family of game over UI
		var gameOverUI = this.gameOverUI.mt.children;
		
		this.gameOverUI.forEach(function(child) {			
			if(child instanceof Phaser.Text) {
				child.font = FONT_NAME;
			}			
		});	
		
		medal = gameOverUI.medal;
		gameOverUI.startButton.inputEnabled = true;
		gameOverUI.startButton.events.onInputUp.add(function() {
			if(stateGAMEOVER) {
				stateGAMEOVER = false;
				stateCLICKED = true;
			}
			
		}, this);
		
		// change game environment
		this.updateGameEnv();
		
		
	},
	tweetscore: function(){
        //share score on twitter
        var tweetbegin = 'http://twitter.com/home?status=';
        var tweettxt = 'I scored '+100+' at this game -' + window.location.href + '.';
        var finaltweet = tweetbegin +encodeURIComponent(tweettxt);
        window.open(finaltweet,'_blank');
    },
	startGame: function() {			
		
		// other game prop setup
		this.introUI.setAll('alpha', 0);
		this.planeAnim.stop();
		this.plane.body.gravity.y = GRAVITY;
		
		// start moving background
		this.bg.autoScroll(-50, 0);		
		
		// start moving bootom grass
		this.ground.autoScroll(-200, 0);		
		
		// start moving obstacles
		this.moveObstacles(ROCK_VELOCITY);	
		
		// spawn the enemy
		this.spawnEnemy();
		
		
	},
	stopGame: function() {
		// stop moving background
		this.bg.autoScroll(0, 0);		
		
		// stop moving bottom grass
		this.ground.autoScroll(0, 0);		
		
		// stop moving obstacles
		this.moveObstacles(0);
		
		// game over message
		this.showGameOverUI();	
		
		// stop plane sprite animation
		this.plane.animations.stop();
		
	},
	// called only start and restart
	updateGameEnv: function() {
		var num = game.rnd.integerInRange(0, 2);
		
		var gameEnv = envArray[num];
		
		this.rocks.forEach(function(rockGroup) {
			
			rockGroup.forEach(function(child) {
				
				if(child.getData().name == "launcher") {
					child.alpha = 0;
				}
				
				else if(child.getData().name == "star") {
					// if this is star give a rotation animation
					var tween = game.add.tween(child).to( { angle: 360 }, 2000, Phaser.Easing.Linear.None, true);
					tween.repeat(-1);
				}
				
				else {
					// change the obstacles frame
					if(child.frameName.indexOf("Down") > -1) {
						child.frameName = "rock"+gameEnv+"Down";
					}else {
						child.frameName = "rock"+gameEnv;
					}
				}
				
				// add start obstacle positions to reset purposes
				var pos = {
					x : child.position.x
				};
				prevRockPositions.push(pos);
				
			});
		});
		
		// if there's a ground remove and add new
		if(this.ground) {
			this.ground.destroy();
		}
		
		// add ground
		this.ground = game.add.tileSprite(0, game.height-71, 808, 71, "/ground"+gameEnv+".png");
		game.physics.arcade.enableBody(this.ground); // apply physics to the ground	
		
	},
	// enemy plane needs to come from off the boundry towards the player
	// this is for reposition the enemy
	spawnEnemy: function() {
		if(!ENABLE_ENEMY) return;
		
		// reset velocity 
		this.enemy.body.velocity.x = -500;
		this.enemy.body.velocity.y = 0;
		
		// reset positions
		this.enemy.position.y = game.rnd.integerInRange(200, game.world.width-200);	
		this.enemy.position.x = 700;
	},
	updateScore:function() {
		this.scoreText.text = score;		
	},	
	update: function(){
		
		this.updateScore();				
		
		// start state 
		if(stateSTART) {
			console.log("state START");
			stateSTART = false;			
			
			this.startGame();			
		}
		
		
		// clicked state
		if(stateCLICKED && stateRUNNING) {
			console.log("state CLICKED");
			stateCLICKED = false;
			
			// invoke jump function 
			this.makeAJump();
			
			//enemy spawn
			if(this.enemy.position.x < -50) {
				this.spawnEnemy();
			}
			
		}
		
		if(stateCLICKED && !stateGAMEOVER) {
			stateCLICKED = false;
			score = 0;
			this.showIntroAnim();
			this.gameOverUI.setAll('alpha', 0);
			this.rePositionObstacles();
			this.updateGameEnv();
		}
		
		
		// running state
		if(stateRUNNING) {
			console.log("state RUNNING");
			// spawn the obstacle
			this.spawnObstacles(true);
			
			// update all game physics
			this.updateGamePhysics(this);
			
			// reset plane angle
			if(this.plane.angle < 10) {
				this.plane.angle += 2.5;
			}
			
			
		}
		
		
		// end state
		if(stateEND) {
			console.log("state END");
			stateEND = false;
			stateRUNNING = false;
			stateGAMEOVER = true;
			
			this.stopGame();
			gameOverSound.play();
			
		}
		
	},
	spawnObstacles: function() {
		this.rocks.forEach(function(childGroup) {
			var changed = false;
			
			childGroup.forEach(function(child) {			
				
				// reposition if the obstacle is out of the game screen 
				if(child.position.x < -900) {
					child.position.x = 0;					
					changed = true;
					
					// reset score flag 
					if(child.getData().name == "launcher") {
						child.hasScored = false;
					}
					
					else if(child.getData().name == "star") {
						if(Phaser.Math.chanceRoll()) {
							child.alpha = 1;
						}else {
							child.alpha = 0;
						}
						
						// change stars
						var rnd = game.rnd.integerInRange(1, 3);
						child.frameName = starArray[rnd-1];
					}
				}
			});

			// reposition the y axis of each obstacle
			if(changed) {
				var rockY = game.rnd.integerInRange(-150, 150);
				childGroup.position.y = rockY;
				changed = !changed;
			}

		});
		
		
	},
	showGameOverUI: function() {
		if(score >= bestScore) {
			this.changeMedal(1);
		}else if(Math.abs(bestScore - score) < 5) {
			this.changeMedal(2);
		
		}else {
			this.changeMedal(3);
		}
		this.gameOverUI.setAll('alpha', 1);
		game.add.tween(this.gameOverUI).from( { y: 800 }, 1000, Phaser.Easing.Bounce.Out, true);	
		
		
		if(score > bestScore) {
			bestScore = score;
			localStorage.setItem("score", ""+score);
			this.gameOverUI.mt.children.NewScoreTitle.fontSize = 14;
			this.gameOverUI.mt.children.NewScoreTitle.text = "NEW ";
		}else {
			this.gameOverUI.mt.children.NewScoreTitle.text = " ";
		}
		this.gameOverUI.mt.children.ScoreText.text = score;
		this.gameOverUI.mt.children.BestScoreText.text = bestScore;
		
		// set default text
		this.gameOverUI.mt.children.MedalTitle.text = "MEDAL";
		this.gameOverUI.mt.children.ScoreTitle.text = "SCORE";
		this.gameOverUI.mt.children.BestTitle.text = "BEST";
		this.gameOverUI.mt.children.StartText.text = "START";		
		
	},
	showIntroAnim: function() {
		this.introUI.setAll('alpha', 1);
		this.gameOverUI.setAll('alpha', 0);
		this.plane.body.gravity.y = 0;
		this.planeAnim.start();
		this.planeAnim.isLooping = true;
		this.plane.animations.play("fly");
	},
	changeMedal: function(medalNo) {
		medal.frameName = medalArray[medalNo-1];
	},
	changeStar: function(star, starNo) {
		star.frameName = starArray[starNo-1];
	},
	moveObstacles: function(velocity) {
		
		this.rocks.forEach(function(child) {
			if(velocity !== 0){
				var rockY = game.rnd.integerInRange(-200, 200);
				child.position.y = rockY;
			}
			child.setAll("body.velocity.x", velocity * -1);
		});
	},
	makeAJump: function() {
		// plane physics
		this.plane.body.velocity.y = JUMP_VELOCITY * -1;
		game.add.tween(this.plane).to({angle: -20}, 100).start();	
		jumpSound.play();
		
	},
	rePositionObstacles: function() {
		var i = 0;				
		this.rocks.forEach(function(rockGroup) {
			rockGroup.forEach(function(child) {
				child.hasScored = false;
				if(child.getData().name == "star") child.alpha = 1;
				child.position.x = prevRockPositions[i].x;
				i++;
			});
		});
	},
	// every thing related to collide, overlap goes over here
	updateGamePhysics: function() {
		var plane = this.plane;
		
		// check if its hits the paralex ground
		game.physics.arcade.overlap(this.plane, this.ground, function(plane, ground){
			stateEND = true;
			ground.body.destroy();
		}, null, this);
		
		// check if its hit with the enemy
		if(ENABLE_ENEMY) {
			game.physics.arcade.collide(this.plane, this.enemy, function(plane, enemy) {
				stateEND = true;
			});
		}
		
		
		this.rocks.forEach(function(rock) {
			rock.forEach(function(child) {

				// score collision
				if(child.getData().name == "launcher") {
					game.physics.arcade.overlap(
						child, plane,
						function() {

							if(!child.hasScored) {
								score++;
								child.hasScored = true;
							}

						}, null, this);
				}
				
				else if(child.getData().name == "star") {
					
					game.physics.arcade.overlap(
						child, plane,
						function() {
							if(child.alpha != 0) {
								collectSound.play();
							}
							child.alpha = 0;
							
						}, null, this);
				}
				
				// game over collision
				else {
					game.physics.arcade.collide(
						child, plane,
						function() {
							stateEND = true;
						}, null, this);
				}

			});

		});
	},
	
	// make this full screen
	goFullscreen: function() {
        if (game.scale.isFullScreen) {
            //game.scale.stopFullScreen();
        } else {
            //resets alignment and enters fullscreen
            //not needed if alignment isn't changed to true beforehand
            game.scale.setMaximum();
            game.scale.setScreenSize(true);
            game.scale.pageAlignVertically = false;
            game.scale.pageAlignHorizontally = false;
            game.scale.startFullScreen(false); //true=antialiasing ON, false=antialiasing off
        }
    }
};
