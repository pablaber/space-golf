document.getElementById("reset-level").onclick = function() {
	loadLevel(currentLevel);
};

// SPACE GOLF

// CONSTANTS
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

const EXPLODE_COLOR = "red";
const EXPLODE_MAX = 20;

const SHIP_RADIUS = 5;
const SHIP_COLOR = "#362af2";
const SHIP_SPEED = 2;
const SHIP_MASS = 3;

const GRAV = 40;
const MIN_GRAV = GRAV / 10000;

const GOAL_RADIUS = 15;
const GOAL_COLOR_PRIMARY = "#2fdddd";
const GOAL_COLOR_SECONDARY = "#ffdb72"

var canvas = document.getElementById("space-golf");

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

var c = canvas.getContext("2d");

// OBJECTS

function Ship(x, y, dx = 0, dy = 0) {
	this.x = x;
	this.y = y;
	this.dx = dx;
	this.dy = dy;
	this.mass = SHIP_MASS;
	this.moving = dx != 0 || dy != 0;
	this.visible = true;
	this.exploding = false;
	this.explodeRadius = 0;

	this.addVelocity = function(v) {
		this.dx += v.x;
		this.dy += v.y;
	};

	this.draw = function() {
		if (this.visible) {
			c.beginPath();
			c.arc(this.x, this.y, SHIP_RADIUS, 0, Math.PI * 2, false);
			c.lineWidth = 0;
			c.fillStyle = SHIP_COLOR;
			c.fill();
		}
		if (this.exploding) {
			c.beginPath();
			c.arc(this.x, this.y, this.explodeRadius, 0, Math.PI * 2, false);
			c.lineWidth = 0;
			c.fillStyle = EXPLODE_COLOR;
			c.fill();
			if (this.explodeRadius < EXPLODE_MAX) {
				this.explodeRadius++;
			} else {
				this.exploding = false;
				this.visible = false;
			}
		}
	};

	this.update = function() {
		if (
			(this.x + SHIP_RADIUS > CANVAS_WIDTH || this.x - SHIP_RADIUS < 0) &&
			this.moving
		) {
			this.dx = 0;
			this.dy = 0;
			this.moving = false;
			this.exploding = true;
			levelFailed = true;
		}
		if (
			(this.y + SHIP_RADIUS > CANVAS_HEIGHT || this.y - SHIP_RADIUS < 0) &&
			this.moving
		) {
			this.dx = 0;
			this.dy = 0;
			this.moving = false;
			this.exploding = true;
			levelFailed = true;
		}
		this.x += this.dx;
		this.y += this.dy;

		this.draw();
	};
}

function Asteroid(x, y, dx, dy, radius, mass, color) {
	this.x = x;
	this.y = y;
	this.dx = dx;
	this.dy = dy;
	this.mass = mass;
	this.radius = radius;
	this.color = color;

	this.containsShip = function(ship) {
		var d = Math.sqrt(
			Math.pow(this.x - ship.x, 2) + Math.pow(this.y - ship.y, 2)
		);
		return d <= this.radius;
	};

	this.addVelocity = function(v) {
		this.dx += v.x;
		this.dy += v.y;
	};

	this.draw = function() {
		c.beginPath();
		c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		c.lineWidth = 0;
		c.fillStyle = this.color;
		c.fill();
	};

	this.update = function() {
		this.x += this.dx;
		this.y += this.dy;
		this.draw();
	};
}

function Planet(x, y, radius, mass, color) {
	this.x = x;
	this.y = y;
	this.radius = radius;
	this.mass = mass;
	this.color = color;

	this.containsShip = function(ship) {
		var d = Math.sqrt(
			Math.pow(this.x - ship.x, 2) + Math.pow(this.y - ship.y, 2)
		);
		return d <= this.radius;
	};

	this.draw = function() {
		c.beginPath();
		c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		c.lineWidth = 0;
		c.fillStyle = this.color;
		c.fill();
	};

	this.update = function() {
		this.draw();
	};
}

function Belt(x1, y1, x2, y2, width) {
	this.x1 = x1;
	this.y1 = y1;
	this.x2 = x2;
	this.y2 = y2;
	this.width = width;
	this.rocks = [];

	this.minX = x1 <= x2 ? x1 - width : x2 - width;
	this.maxX = x1 > x2 ? x1 + width : x2 + width;
	this.minY = y1 <= y2 ? y1 - width : y2 - width;
	this.maxY = y1 > y2 ? y1 + width : y2 + width;

	var slope = this.x1 == this.x2 ? null : (this.y2 - this.y1)/(this.x2 - this.x1);

	for(var i = 0; i < 100; i++) {
		var randomX;
		if(!!slope && this.x1 < this.x2) randomX = Math.random()*(this.x2-this.x1) + this.x1;
		else if(!!slope && this.x2 < this.x1) randomX = Math.random()*(this.x1-this.x2) + this.x2;
		var randomY = slope*(randomX - this.x1) + this.y1;
		randomX += Math.random()*this.width - (1/2)*this.width;
		randomY += Math.random()*this.width - (1/2)*this.width;

		var randomDx, randomDy
		if(slope < 1) {
			randomDx = Math.random()-0.5;
			randomDy = randomDx*slope;
		} else {
			randomDy = Math.random()-0.5;
			randomDx = randomDy/slope;
		}
		this.rocks.push(new BeltRock(randomX, randomY, randomDx, randomDy, 3));
	}

	this.containsShip = function(ship) {
		if(ship.x < this.maxX && ship.x > this.minX && ship.y < this.maxY && ship.y > this.minY) {
			if(slope < 1) {
				var yForX = slope*(ship.x - this.x1) + this.y1;
				if(ship.y > yForX - (this.width/2) && ship.y < yForX + (this.width/2)) return true;
				else return false;
			}
			else {
				var xForY = (1/slope)*(ship.y - this.y1) + this.x1;
				if(ship.x > xForY - (this.width/2) && ship.x < xForY + (this.width/2)) return true;
				else return false;
			}
		}
		else return false;
	};

	this.draw = function() {
		for(rock of this.rocks) {
			rock.draw();
		}
	}

	this.update = function() {
		for(rock of this.rocks) {
			if(rock.x > this.maxX || rock.x < this.minX || rock.y > this.maxY || rock.y < this.minY)
				rock.reverse();
			rock.update();
		}
		this.draw();
	}
}

function BeltRock(x, y, dx, dy, radius) {
	this.x = x;
	this.y = y;
	this.dx = dx;
	this.dy = dy;
	this.radius = radius;

	this.reverse = function() {
		this.dx = -this.dx;
		this.dy = -this.dy;
	}

	this.draw = function() {
		c.beginPath();
		c.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
		c.lineWidth = 0;
		c.fillStyle = GOAL_COLOR_SECONDARY;
		c.fill();
	}

	this.update = function() {
		this.x += this.dx;
		this.y += this.dy;
	}
}

function Goal(x, y) {
	this.x = x;
	this.y = y;
	this.radius = GOAL_RADIUS;
	this.originalRadius = GOAL_RADIUS;
	this.growing = true;

	this.containsShip = function(ship) {
		var d = Math.sqrt(
			Math.pow(this.x - ship.x, 2) + Math.pow(this.y - ship.y, 2)
		);
		return d <= GOAL_RADIUS;
	};

	this.draw = function() {
		c.beginPath();
		c.arc(this.x, this.y, (1.2)*this.originalRadius, 0, Math.PI*2, false);
		c.lineWidth = 0;
		c.fillStyle = GOAL_COLOR_SECONDARY;
		c.fill();
		c.beginPath();
		c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
		c.lineWidth = 0;
		c.fillStyle = GOAL_COLOR_PRIMARY;
		c.fill();

	};

	this.update = function() {
		if(this.growing) {
			if(this.radius < this.originalRadius * 1.1) {
      			var diff = Math.abs(this.radius - this.originalRadius)
      			this.radius += (1/4) / (diff + 1);
        		//this.lineWidth -= (1/2) / (diff + 1);
      		}
      		else {
      			this.growing = false;
      		}
		}
		else {
    		if(this.radius > this.originalRadius * .9) {
      			var diff = Math.abs(this.radius - this.originalRadius)
      			this.radius -= (1/4) / (diff + 1)
        		//this.lineWidth += (1/2) / (diff + 1);
      		}
      		else {
      			this.growing = true;
      		}
		}
		this.draw();
	};
}

function Text(message, x, y, font, fill, align) {
	this.message = message;
	this.x = x;
	this.y = y;
	this.font = font;
	this.fill = fill;
	this.align = align;

	this.draw = function() {
		c.font = this.font;
		c.fillStyle = this.fill;
		c.textAlign = this.align;
		c.fillText(this.message, this.x, this.y);
	};

	this.update = function() {
		this.draw();
	};
}

function Clickable(x, y, width, height, opacity, fill, method) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.opacity = opacity;
	this.fill = fill;
	this.method = method;

	this.callIfClicked = function() {
		if (
			mouse.x >= this.x &&
			mouse.x <= this.x + this.width &&
			mouse.y >= this.y &&
			mouse.y <= this.y + this.height
		) {
			this.method();
		}
	};

	this.draw = function() {
		c.globalAlpha = opacity;
		c.fillStyle = fill;
		c.fillRect(x, y, width, height);
		c.globalAlpha = 1.0;
	};

	this.update = function() {
		this.draw();
	};
}

function Velocity() {
	this.x1 = undefined;
	this.y1 = undefined;
	this.x2 = undefined;
	this.y2 = undefined;

	this.changeDestination = function(x, y) {
		this.x2 = x;
		this.y2 = y;
	};

	this.getVelocity = function() {
		return {
			x: (this.x2 - this.x1) / (100 / SHIP_SPEED),
			y: (this.y2 - this.y1) / (100 / SHIP_SPEED)
		};
	};

	this.draw = function() {
		c.beginPath();
		c.moveTo(this.x1, this.y1);
		c.lineTo(this.x2, this.y2);
		c.strokeStyle = "#fa34dd";
		c.stroke();
	};

	this.update = function() {
		this.draw();
	};
}

// EVENT LISTENERS

var mouse = {
	x: undefined,
	y: undefined
};

var settingVelocity = false;

window.addEventListener("mousemove", function(event) {
	if (event.offsetX) {
		mouse.x = event.offsetX;
		mouse.y = event.offsetY;
	} else if (event.layerX) {
		mouse.x = event.layerX;
		mouse.y = event.layerY;
	}
});

window.addEventListener("mousedown", function(event) {
	if (!!ship && mouseDownInPlayer() && !ship.moving) {
		velocity.x1 = ship.x;
		velocity.y1 = ship.y;
		velocity.x2 = mouse.x;
		velocity.y2 = mouse.y;
		settingVelocity = true;
	}
});

window.addEventListener("mouseup", function(event) {
	if (settingVelocity) {
		var dv = velocity.getVelocity();
		ship.dx = dv.x;
		ship.dy = dv.y;
		ship.moving = true;
		settingVelocity = false;
	}
});

window.addEventListener("click", function(event) {
	for (clickable of clickables) {
		clickable.callIfClicked();
	}
});

var mouseDownInPlayer = function() {
	if (Math.abs(mouse.x - ship.x) <= SHIP_RADIUS * 2) {
		return true;
	} else {
		return false;
	}
};

// MATH STUFF
var fg = function(a, b) {
	var distx = a.x - b.x;
	var disty = a.y - b.y;
	var theta = Math.atan(disty / distx);
	var r = Math.sqrt(Math.pow(distx, 2) + Math.pow(disty, 2));
	var fg = GRAV * a.mass * b.mass / Math.pow(r, 2);
	if (fg < MIN_GRAV) fg = 0;
	var quadMult = distx >= 0 ? 1 : -1;
	return {
		x: fg * quadMult * Math.cos(theta),
		y: fg * quadMult * Math.sin(theta)
	};
};

// MAIN METHODS

var ship, goal, planets, asteroids, texts, clickables, belts;
var velocity = new Velocity();

var levelComplete = false;
var levelFailed = false;

var homeScreen = {
	ship: undefined,
	planets: [
		new Planet((1/2)*CANVAS_WIDTH, (2/3)*CANVAS_HEIGHT, 50, 10, "#ababab")
	],
	asteroids: [
		new Asteroid((1/2)*CANVAS_WIDTH-200, (2/3)*CANVAS_HEIGHT, 0, -2, 10, 4, "#555"),
		new Asteroid((1/2)*CANVAS_WIDTH+200, (2/3)*CANVAS_HEIGHT, 0, 2, 10, 4, "#555")
	],
	texts: [
		new Text("Space Golf",(1/2)*CANVAS_WIDTH, (1/3)*CANVAS_HEIGHT, "30px Arial Black", "green", "center"),
		new Text("Start", (1/2)*CANVAS_WIDTH, (2/3)*CANVAS_HEIGHT+8, "20px Arial Black", "black", "center")
	],
	clickables: [
		new Clickable((1/2)*CANVAS_WIDTH-35, (2/3)*CANVAS_HEIGHT- 20, 70, 40, 0, "red", function() {
			currentLevel = level01;
			loadLevel(currentLevel);
		})
	],
	belts: [],
	goal: undefined
};

// LEVELS

var level01 = {
  	ship: new Ship(100, (1/2)*CANVAS_HEIGHT),
  	planets: [],
  	asteroids: [],
  	texts: [
  		new Text("This is your ship.", 100, (1/2)*CANVAS_HEIGHT - 40, "16px Arial Black", "white", "center"),
		new Text("This is the goal.", CANVAS_WIDTH - 100, (1/2)*CANVAS_HEIGHT - 40, "16px Arial Black", "white", "center"),
		new Text("Launch your ship into the goal by clicking and dragging.", (1/2)*CANVAS_WIDTH, (3/4)*CANVAS_HEIGHT, "16px Arial Black", "white", "center")
  	],
  	clickables: [
		new Clickable(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0, "red", function() {
			if(levelComplete) {
				levelComplete = false;
				currentLevel = level02;
				loadLevel(currentLevel);
			}
			else if(levelFailed) {
				levelFailed = false;
				loadLevel(currentLevel);
			}
		})
	],
	belts: [],
  	goal: new Goal(CANVAS_WIDTH - 100, (1/2)*CANVAS_HEIGHT)
}

var level02 = {
  	ship: new Ship(100, (2/3)*CANVAS_HEIGHT),
  	planets: [
	  	new Planet((1/2)*CANVAS_WIDTH, (1/4)*CANVAS_HEIGHT, 40, 8, "#ababab")
  	],
  	asteroids: [],
  	texts: [
  		new Text("This is a planet.", (1/2)*CANVAS_WIDTH, (1/4)*CANVAS_HEIGHT-50, "16px Arial Black", "white", "center"),
		new Text("A plantet's gravity will pull your ship towards it.", (1/2)*CANVAS_WIDTH, (9/10)*CANVAS_HEIGHT, "16px Arial Black", "white", "center"),
		new Text("The bigger the planet, the stronger it pulls.", (1/2)*CANVAS_WIDTH, (9/10)*CANVAS_HEIGHT+20, "16px Arial Black", "white", "center"),
  	],
  	clickables: [
		new Clickable(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0, "red", function() {
			if(levelComplete) {
				levelComplete = false;
				currentLevel = level03;
				loadLevel(currentLevel);
			}
			else if(levelFailed) {
				levelFailed = false;
				loadLevel(currentLevel);
			}
		})
	],
	belts: [],
  	goal: new Goal(CANVAS_WIDTH-100, (2/3)*CANVAS_HEIGHT)
}

var level03 = {
  	ship: new Ship(100, (1/2)*CANVAS_HEIGHT),
  	planets: [
    	new Planet((1/2)*CANVAS_WIDTH, 0, 40, 8, "#ab5612")
  	],
  	asteroids: [
    	new Asteroid((1/2)*CANVAS_WIDTH, -75, 6.7, 0, 15, 6.7, "#aaaaaa"),
  	],
  	texts: [
    	new Text("This is an asteroid.", (1/2)*CANVAS_WIDTH, (1/3)*CANVAS_HEIGHT-25, "20px Arial Black", "white", "center"),
    	new Text("Asteroids will orbit around a planet,", CANVAS_WIDTH/2, (3/4)*CANVAS_HEIGHT, "20px Arial Black", "white", "center"),
    	new Text("but have no gravitational pull on your ship.", CANVAS_WIDTH/2, (3/4)*CANVAS_HEIGHT+25, "20px Arial Black", "white", "center"),
    	new Text("Don't hit asteroids.", CANVAS_WIDTH/2, (3/4)*CANVAS_HEIGHT+60, "20px Arial Black", "white", "center")
  	],
  	clickables: [
		new Clickable(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0, "red", function() {
			if(levelComplete) {
				levelComplete = false;
				currentLevel = level04;
				loadLevel(currentLevel);
			}
			else if(levelFailed) {
				levelFailed = false;
				loadLevel(currentLevel);
			}
		})
	],
	belts: [],
  	goal: new Goal(CANVAS_WIDTH-100, (1/2)*CANVAS_HEIGHT)
}

level04 = {
	ship: new Ship(100, (1/2)*CANVAS_HEIGHT),
  	planets: [
    	new Planet((1/2)*CANVAS_WIDTH, (1/2)*CANVAS_HEIGHT, 40, 8, "#ab5612")
  	],
  	asteroids: [],
  	texts: [],
  	clickables: [
		new Clickable(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0, "red", function() {
			if(levelComplete) {
				levelComplete = false;
				currentLevel = level05;
				loadLevel(currentLevel);
			}
			else if(levelFailed) {
				levelFailed = false;
				loadLevel(currentLevel);
			}
		})
	],
	belts: [
		new Belt((1/2)*CANVAS_WIDTH, (1/2)*CANVAS_HEIGHT, (1/2)*CANVAS_WIDTH+1, CANVAS_HEIGHT, 20)
	],
  	goal: new Goal(CANVAS_WIDTH-100, (1/2)*CANVAS_HEIGHT)
}

var level05 = {
    ship: new Ship(100, (1/2)*CANVAS_HEIGHT),
    planets: [
        new Planet((1/2)*CANVAS_WIDTH, (1/3)*CANVAS_HEIGHT, 60, 6, "#ab5612"),
        new Planet((1/2)*CANVAS_WIDTH, (2/3)*CANVAS_HEIGHT, 60, 6, "#ab5612")
    ],
    asteroids: [],
    texts: [
      new Text("Good Luck!", CANVAS_WIDTH/2, (1/6)*CANVAS_HEIGHT, "20px Arial Black", "white", "center")
    ],
    clickables: [
		new Clickable(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0, "red", function() {
			if(levelComplete) {
				levelComplete = false;
				currentLevel = level06;
				loadLevel(currentLevel);
			}
			else if(levelFailed) {
				levelFailed = false;
				loadLevel(currentLevel);
			}
		})
	],
	belts: [],
    goal: new Goal(CANVAS_WIDTH - 100, (1/2)*CANVAS_HEIGHT)
}

var level06 = {
    ship: new Ship(100, (1/4)*CANVAS_HEIGHT),
    planets: [
        new Planet((1/3)*CANVAS_WIDTH, (3/4)*CANVAS_HEIGHT, 100, 10, "#ab5612"),
        new Planet((3/4)*CANVAS_WIDTH, (1/3)*CANVAS_HEIGHT, 60, 6, "#ab5612")
    ],
    asteroids: [],
    texts: [],
    clickables: [
		new Clickable(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0, "red", function() {
			if(levelComplete) {
				levelComplete = false;
				currentLevel = level07;
				loadLevel(currentLevel);
			}
			else if(levelFailed) {
				levelFailed = false;
				loadLevel(currentLevel);
			}
		})
	],
	belts: [],
    goal: new Goal((3/4)*CANVAS_WIDTH, (3/4)*CANVAS_HEIGHT)
}

var level07 = {
	ship: new Ship((1/4)*CANVAS_WIDTH, (1/8)*CANVAS_HEIGHT),
    planets: [
        new Planet((3/5)*CANVAS_WIDTH, (1/2)*CANVAS_HEIGHT, 70, 35, "#ab5612")
    ],
    asteroids: [],
    texts: [],
    clickables: [
		new Clickable(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0, "red", function() {
			if(levelComplete) {
				levelComplete = false;
				currentLevel = level08;
				loadLevel(currentLevel);
			}
			else if(levelFailed) {
				levelFailed = false;
				loadLevel(currentLevel);
			}
		})
	],
	belts: [
		new Belt((3/5)*CANVAS_WIDTH, (1/2)*CANVAS_HEIGHT, 0, (1/2)*CANVAS_HEIGHT+1, 20)
	],
    goal: new Goal((1/4)*CANVAS_WIDTH, (7/8)*CANVAS_HEIGHT)
}

var level08 = {
    ship: new Ship(100, (1/2)*CANVAS_HEIGHT),
    planets: [
        new Planet((1/2)*CANVAS_WIDTH, (1/2)*CANVAS_HEIGHT, 70, 35, "#ab5612")
    ],
    asteroids: [
      new Asteroid(CANVAS_WIDTH/2, (1/4)*CANVAS_HEIGHT, 5, 0, 20, 2.3, "#dddddd"),
      new Asteroid(CANVAS_WIDTH/2, (3/4)*CANVAS_HEIGHT, -5, 0, 20, 2.3, "#dddddd")
    ],
    texts: [],
    clickables: [
		new Clickable(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0, "red", function() {
			if(levelComplete) {
				levelComplete = false;
				currentLevel = level09;
				loadLevel(currentLevel);
			}
			else if(levelFailed) {
				levelFailed = false;
				loadLevel(currentLevel);
			}
		})
	],
	belts: [],
    goal: new Goal(CANVAS_WIDTH - 100, (1/2)*CANVAS_HEIGHT)
}

var level09 = {
    ship: new Ship(100, (1/6)*CANVAS_HEIGHT),
    planets: [
        new Planet((1/3)*CANVAS_WIDTH, CANVAS_HEIGHT, 200, 100, "#ab5612"),
        new Planet((3/5)*CANVAS_WIDTH, (3/5)*CANVAS_HEIGHT, 50, 20, "#ab5612")
    ],
    asteroids: [],
    texts: [],
    clickables: [
		new Clickable(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0, "red", function() {
			if(levelComplete) {
				levelComplete = false;
				currentLevel = level10;
				loadLevel(currentLevel);
			}
			else if(levelFailed) {
				levelFailed = false;
				loadLevel(currentLevel);
			}
		})
	],
	belts: [],
    goal: new Goal((5/7)*CANVAS_WIDTH, (9/10)*CANVAS_HEIGHT)
}

var level10 = {
    ship: new Ship((1/12)*CANVAS_WIDTH, (7/8)*CANVAS_HEIGHT),
    planets: [
        new Planet((1/4)*CANVAS_WIDTH, (5/7)*CANVAS_HEIGHT, 50, 20, "#ab5612")
    ],
    asteroids: [],
    texts: [],
    clickables: [
		new Clickable(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 0, "red", function() {
			if(levelComplete) {
				levelComplete = false;
				currentLevel = level11;
				loadLevel(currentLevel);
			}
			else if(levelFailed) {
				levelFailed = false;
				loadLevel(currentLevel);
			}
		})
	],
	belts: [],
    goal: new Goal((6/7)*CANVAS_WIDTH, (1/5)*CANVAS_HEIGHT)
}

var level11 = {
    ship: new Ship((1/8)*CANVAS_WIDTH, (5/8)*CANVAS_HEIGHT),
    planets: [
        new Planet((1/2)*CANVAS_WIDTH, (1/12)*CANVAS_HEIGHT, 80, 14, "#ab5612")
    ],
    asteroids: [
        new Asteroid((1/2)*CANVAS_WIDTH-150, (1/12)*CANVAS_HEIGHT, 0, 4.6, 15, 6, "#dddddd"),
        new Asteroid((1/2)*CANVAS_WIDTH, (1/2)*CANVAS_HEIGHT, -4, 0, 15, 6, "#dddddd"),
        new Asteroid((1/2)*CANVAS_WIDTH+175, (1/12)*CANVAS_HEIGHT, 0, -5.5, 15, 10, "#dddddd")
    ],
    texts: [],
    clickables: [],
	belts: [],
    goal: new Goal((6/7)*CANVAS_WIDTH, (2/5)*CANVAS_HEIGHT)
}

var currentLevel = homeScreen;

var cloneLevel = function(level) {
	var cloneShip,
		clonePlanets,
		cloneAsteroids,
		cloneTexts,
		cloneClickables,
		cloneBelts,
		cloneGoal;
	if (!!level.ship) cloneShip = new Ship(level.ship.x, level.ship.y);
	var clonePlanets = [];
	for (planet of level.planets) {
		clonePlanets.push(
			new Planet(planet.x, planet.y, planet.radius, planet.mass, planet.color)
		);
	}
	var cloneAsteroids = [];
	for (asteroid of level.asteroids) {
		cloneAsteroids.push(
			new Asteroid(
				asteroid.x,
				asteroid.y,
				asteroid.dx,
				asteroid.dy,
				asteroid.radius,
				asteroid.mass,
				asteroid.color
			)
		);
	}
	var cloneTexts = [];
	for (text of level.texts) {
		cloneTexts.push(
			new Text(text.message, text.x, text.y, text.font, text.fill, text.align)
		);
	}

	var cloneClickables = [];
	for (clickable of level.clickables) {
		cloneClickables.push(
			new Clickable(
				clickable.x,
				clickable.y,
				clickable.width,
				clickable.height,
				clickable.opacity,
				clickable.fill,
				clickable.method
			)
		);
	}

	var cloneBelts = [];
	for(belt of level.belts) {
		cloneBelts.push(new Belt (belt.x1, belt.y1, belt.x2, belt.y2, belt.width));
	}

	if (!!level.goal) cloneGoal = new Goal(level.goal.x, level.goal.y);
	return {
		ship: cloneShip,
		planets: clonePlanets,
		asteroids: cloneAsteroids,
		texts: cloneTexts,
		clickables: cloneClickables,
		belts: cloneBelts,
		goal: cloneGoal
	};
};

var loadLevel = function(level) {
	levelClone = cloneLevel(level);
	ship = levelClone.ship;
	planets = levelClone.planets;
	goal = levelClone.goal;
	texts = levelClone.texts;
	clickables = levelClone.clickables;
	belts = levelClone.belts;
	asteroids = levelClone.asteroids;
	init();
};

function init() {
	for (belt of belts) {
		belt.draw();
	}
	for (planet of planets) {
		planet.draw();
	}
	for (asteroid of asteroids) {
		asteroid.draw();
	}
	for (text of texts) {
		text.draw();
	}
	for (clickable of clickables) {
		clickable.draw();
	}
	if (!!goal) goal.draw();
	if (!!ship) ship.draw();
}

function animate() {
	requestAnimationFrame(animate);
	c.clearRect(0, 0, innerWidth, innerHeight);

	if (!!ship && ship.moving) {
		for (planet of planets) {
			var v = fg(planet, ship);
			ship.addVelocity(v);
			if (planet.containsShip(ship)) {
				levelFailed = true;
				ship.moving = false;
				ship.dx = 0;
				ship.dy = 0;
				ship.exploding = true;
			}
		}
		for(asteroid of asteroids) {
			if (asteroid.containsShip(ship)) {
				levelFailed = true;
				ship.moving = false;
				ship.dx = 0;
				ship.dy = 0;
				ship.exploding = true;
			}
		}
		for(belt of belts) {
			if (belt.containsShip(ship)) {
				levelFailed = true;
				ship.moving = false;
				ship.dx = 0;
				ship.dy = 0;
				ship.exploding = true;
			}
		}
		if (goal.containsShip(ship)) {
			levelComplete = true;
			ship.moving = false;
			ship.dx = 0;
			ship.dy = 0;
			ship.x = goal.x;
			ship.y = goal.y;
		}
	}

	if (asteroids.length > 0) {
		for (planet of planets) {
			for (asteroid of asteroids) {
				var v = fg(planet, asteroid);
				asteroid.addVelocity(v);
			}
		}
	}

	for (belt of belts) {
		belt.update();
	}
	for (planet of planets) {
		planet.update();
	}
	for (asteroid of asteroids) {
		asteroid.update();
	}
	for (text of texts) {
		text.update();
	}
	for (clickable of clickables) {
		clickable.update();
	}


	if (!!goal) goal.update();
	if (!!ship) ship.update();

	if (settingVelocity) {
		velocity.changeDestination(mouse.x, mouse.y);
		velocity.update();
	}
}

loadLevel(currentLevel);
animate();
