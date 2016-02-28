"use strict";

var orientated = false

window.Tplane.state.boot = {
	preload: function(){
		// set world size
		this.game.world.setBounds(0, 0, mt.data.map.worldWidth, mt.data.map.worldHeight);
		
		this.enableScaling();
		
		//init mt helper
		mt.init(this.game);
		
		//set background color - true (set also to document.body)
		mt.setBackgroundColor(true);
		
		// load assets for the Loading group ( if exists )
		mt.loadGroup("Loading");
	},
	create: function(){
		// add all game states
		for(var stateName in window.Tplane.state){
			this.game.state.add(stateName, window.Tplane.state[stateName]);
		}
		
		if (!this.game.device.desktop) {
            //centers the canvas
            this.scale.pageAlignVertically = true;
            this.scale.pageAlignHorizontally = true;

            // forces orientation. First parameter is for landscape, 2nd - portrait. Enable only one
            this.scale.forceOrientation(true, false);
		}
		
		// goto load state
		this.game.state.start("load");
	},
	enableScaling: function(){
		var game = this.game;
		game.scale.parentIsWindow = (game.canvas.parentNode == document.body);
		game.scale.scaleMode = Phaser.ScaleManager[mt.data.map.scaleMode];
		
		
// 		game.scale.pageAlignVertically = true;
// 		game.scale.pageAlignHorizontally = true;
// 		game.scale.setShowAll();
// 		game.scale.refresh();
	}
};