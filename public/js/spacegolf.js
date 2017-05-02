document.getElementById('reset-level').onclick = function() {
    loadLevel(cloneLevel(currentLevel));
}

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
const GOAL_COLOR = "#2fdddd";

var canvas = document.getElementById('space-golf');

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

var c = canvas.getContext('2d');

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
    }

    this.draw = function() {
        if(this.visible) {
            c.beginPath();
            c.arc(this.x, this.y, SHIP_RADIUS, 0, Math.PI * 2, false);
            c.lineWidth = 0;
            c.fillStyle = SHIP_COLOR;
            c.fill();
        }
        if(this.exploding) {
            c.beginPath();
            c.arc(this.x, this.y, this.explodeRadius, 0, Math.PI * 2, false);
            c.lineWidth = 0;
            c.fillStyle = EXPLODE_COLOR;
            c.fill();
            if(this.explodeRadius < EXPLODE_MAX) {
                this.explodeRadius++;
            } else {
                this.exploding = false;
                this.visible = false;
            }
        }
    }

    this.update = function() {
        if ((this.x + SHIP_RADIUS > CANVAS_WIDTH || this.x - SHIP_RADIUS < 0) && this.moving){
            this.dx = 0;
            this.dy = 0;
            this.moving = false;
            this.exploding = true;
        }
        if ((this.y + SHIP_RADIUS > CANVAS_HEIGHT || this.y - SHIP_RADIUS < 0) && this.moving) {
            this.dx = 0;
            this.dy = 0;
            this.moving = false;
            this.exploding = true;
        }
        this.x += this.dx;
        this.y += this.dy;

        this.draw();
  }
}

function Asteroid(x, y, dx, dy, radius, mass, color) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.mass = mass;
    this.radius = radius;

    this.addVelocity = function(v) {
  	    this.dx += v.x;
        this.dy += v.y;
    }

    this.draw = function() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.lineWidth = 0;
        c.fillStyle = this.color;
        c.fill();
    }

    this.update = function() {
        this.x += this.dx;
        this.y += this.dy;
        this.draw()
    }
}

function Planet(x, y, radius, mass, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.mass = mass;
    this.color = color;

    this.containsShip = function(ship) {
        var d = Math.sqrt(Math.pow(this.x - ship.x, 2) + Math.pow(this.y - ship.y, 2))
        return d <= this.radius;
    }

    this.draw = function() {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.lineWidth = 0;
        c.fillStyle = this.color;
        c.fill();
    }

    this.update = function() {
        this.draw();
    }
}

function Goal(x, y) {
    this.x = x;
    this.y = y;

    this.containsShip = function(ship) {
        var d = Math.sqrt(Math.pow(this.x - ship.x, 2) + Math.pow(this.y - ship.y, 2))
        return d <= GOAL_RADIUS;
    }

    this.draw = function() {
        c.beginPath();
        c.arc(this.x, this.y, GOAL_RADIUS, 0, Math.PI * 2, false);
        c.lineWidth = 0;
        c.fillStyle = GOAL_COLOR;
        c.fill();
    }

    this.update = function() {
        this.draw();
    }
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
        c.fillText(this.message, this.x, this.y)
    }

    this.update = function() {
        this.draw();
    }
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
        if(mouse.x >= this.x && mouse.x <= this.x + this.width && mouse.y >= this.y && mouse.y <= this.y + this.height) {
            this.method();
        }
    }

    this.draw = function() {
        c.globalAlpha = opacity;
        c.fillStyle = fill;
        c.fillRect(x, y, width, height);
        c.globalAlpha = 1.0;
    }

    this.update = function() {
        this.draw();
    }
}

function Velocity() {
    this.x1 = undefined;
    this.y1 = undefined;
    this.x2 = undefined;
    this.y2 = undefined;

    this.changeDestination = function(x, y) {
        this.x2 = x;
        this.y2 = y;
    }

    this.getVelocity = function() {
  	    return {
    	    x: (this.x2 - this.x1) / (100/SHIP_SPEED),
            y: (this.y2 - this.y1) / (100/SHIP_SPEED)
        }
    }

    this.draw = function() {
        c.beginPath();
        c.moveTo(this.x1, this.y1);
        c.lineTo(this.x2, this.y2);
        c.strokeStyle = "#fa34dd";
        c.stroke();
    }

    this.update = function() {
        this.draw();
    }
}

// EVENT LISTENERS

var mouse = {
    x: undefined,
    y: undefined
}

var settingVelocity = false;

window.addEventListener('mousemove', function(event) {
    if(event.offsetX) {
        mouse.x = event.offsetX;
        mouse.y = event.offsetY;
    }
    else if(event.layerX) {
        mouse.x = event.layerX;
        mouse.y = event.layerY;
    }
});

window.addEventListener('mousedown', function(event) {
    if (!!ship && mouseDownInPlayer() && !ship.moving) {
        velocity.x1 = ship.x;
        velocity.y1 = ship.y;
        velocity.x2 = mouse.x;
        velocity.y2 = mouse.y;
        settingVelocity = true;
    }
});

window.addEventListener('mouseup', function(event) {
    if(settingVelocity) {
  	    var dv = velocity.getVelocity();
        ship.dx = dv.x;
        ship.dy = dv.y;
        ship.moving = true;
  	    settingVelocity = false;
    }
});

window.addEventListener('click', function(event) {
    for(clickable of clickables) {
        clickable.callIfClicked();
    }
})

var mouseDownInPlayer = function() {
    if (Math.abs(mouse.x - ship.x) <= SHIP_RADIUS * 2) {
        return true;
    } else {
        return false;
    }
}

// MATH STUFF
var fg = function(a, b) {
	var distx = a.x - b.x;
    var disty = a.y - b.y;
    var theta = Math.atan(disty/distx)
    var r = Math.sqrt(Math.pow(distx, 2) + Math.pow(disty, 2))
    var fg = GRAV * a.mass * b.mass / Math.pow(r, 2);
    if(fg < MIN_GRAV) fg = 0;
    var quadMult = distx >= 0 ? 1 : -1;
    return {
        x: fg * quadMult * Math.cos(theta),
        y: fg * quadMult * Math.sin(theta)
    }
}

// MAIN METHODS

var ship, goal, planets, asteroids, texts, clickables;
var velocity = new Velocity();

var homeScreen = {
    ship: undefined,
    planets: [
        new Planet(CANVAS_WIDTH/2, 2*CANVAS_HEIGHT/3, 50, 10, "#ababab")
    ],
    asteroids: [
        new Asteroid(CANVAS_WIDTH/2 - 200, 2*CANVAS_HEIGHT/3, 0, -2, 10, 4, "#555"),
        new Asteroid(CANVAS_WIDTH/2 + 200, 2*CANVAS_HEIGHT/3, 0, 2, 10, 4, "#555")
    ],
    texts: [
        new Text("Space Golf", CANVAS_WIDTH/2, CANVAS_HEIGHT/3  , "30px Arial Black", "green", "center"),
        new Text("Start", CANVAS_WIDTH/2, 2*CANVAS_HEIGHT/3 + 8, "20px Arial Black", "black", "center")
    ],
    clickables: [
        new Clickable(CANVAS_WIDTH/2-35, 2*CANVAS_HEIGHT/3-20, 70, 40, 0, "red", function() {
            currentLevel = level1;
            loadLevel(cloneLevel(currentLevel));
        })
    ],
    goal: undefined
}

var level1 = {
    ship: new Ship(100, 300),
    planets: [
        new Planet(300, 250, 30, 3, "#ab5612"),
        new Planet(400, 500, 40, 4, "#75ff1f")
    ],
    asteroids: [],
    texts: [],
    clickables: [],
    goal: new Goal(500, 200)
}

var cloneLevel = function(level) {
    var cloneShip, clonePlanets, cloneAsteroids, cloneTexts, cloneClickables, cloneGoal;
    if(!!level.ship) cloneShip = new Ship(level.ship.x, level.ship.y);
    var clonePlanets = [];
    for(planet of level.planets) {
        clonePlanets.push(new Planet(planet.x, planet.y, planet.radius, planet.mass, planet.color));
    }
    var cloneAsteroids = [];
    for(asteroid of level.asteroids) {
        cloneAsteroids.push(new Asteroid(asteroid.x, asteroid.y, asteroid.dx, asteroid.dy, asteroid.radius, asteroid.mass, asteroid.color))
    }
    var cloneTexts = [];
    for(text of level.texts) {
        cloneTexts.push(new Text(text.message, text.x, text.y, text.font, text.fill, text.align))
    }

    var cloneClickables = [];
    for(clickable of level.clickables) {
        cloneClickables.push(new Clickable(clickable.x, clickable.y, clickable.width, clickable.height, clickable.opacity, clickable.fill, clickable.method))
    }
    if(!!level.goal) cloneGoal = new Goal(level.goal.x, level.goal.y)
    return {
        ship: cloneShip,
        planets: clonePlanets,
        asteroids: cloneAsteroids,
        texts: cloneTexts,
        clickables: cloneClickables,
        goal: cloneGoal
    }
}

var currentLevel = homeScreen;

var loadLevel = function(level) {
    console.log(level);
    ship = level.ship;
    planets = level.planets;
    goal = level.goal;
    texts = level.texts;
    clickables = level.clickables;
    asteroids = level.asteroids;
    init();
}

function init() {
    for(planet of planets) {
        planet.draw();
    }
    for(asteroid of asteroids) {
        asteroid.draw();
    }
    for(text of texts) {
        text.draw();
    }
    for(clickable of clickables) {
        clickable.draw();
    }
    if(!!goal) goal.draw();
    if(!!ship) ship.draw();
}

function animate() {
    requestAnimationFrame(animate);
    c.clearRect(0, 0, innerWidth, innerHeight);

	if(!!ship && ship.moving) {
        for(planet of planets) {
  	        var v = fg(planet, ship);
  	        ship.addVelocity(v);
            if(planet.containsShip(ship)) {
                ship.moving = false;
                ship.dx = 0;
                ship.dy = 0;
                ship.exploding = true;
            }
        }
        if(goal.containsShip(ship)) {
            ship.moving = false;
            ship.dx = 0;
            ship.dy = 0;
            ship.x = goal.x;
            ship.y = goal.y;
        }
    }

    if(asteroids.length > 0) {
        for(planet of planets) {
            for(asteroid of asteroids) {
                var v = fg(planet, asteroid);
                asteroid.addVelocity(v);
            }
        }
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
    for(clickable of clickables) {
        clickable.update();
    }
    if(!!goal) goal.update();
    if(!!ship) ship.update();

    if (settingVelocity) {
        velocity.changeDestination(mouse.x, mouse.y);
        velocity.update();
    }
}

loadLevel(cloneLevel(currentLevel));
animate();
