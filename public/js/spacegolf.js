// SPACE GOLF

// CONSTANTS
const SHIP_RADIUS = 5;
const SHIP_COLOR = "#362af2";
const SHIP_SPEED = 2;
const SHIP_MASS = 3;

const GRAV = 40;
const MIN_GRAV = GRAV / 10000;

const GOAL_RADIUS = 10;
const GOAL_COLOR = "#2fdddd";

var canvas = document.getElementById('space-golf');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var c = canvas.getContext('2d');

// OBJECTS

function Ship(x, y, dx = 0, dy = 0) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.mass = SHIP_MASS;
    this.moving = dx != 0 || dy != 0;

	this.addVelocity = function(v) {
  	    this.dx += v.x;
        this.dy += v.y;
    }

    this.draw = function() {
        c.beginPath();
        c.arc(this.x, this.y, SHIP_RADIUS, 0, Math.PI * 2, false);
        c.lineWidth = 0;
        c.fillStyle = SHIP_COLOR;
        c.fill();
    }

    this.update = function() {
        if (this.x + SHIP_RADIUS > innerWidth || this.x - SHIP_RADIUS < 0) {
            this.dx = -this.dx;
        }
        if (this.y + SHIP_RADIUS > innerHeight || this.y - SHIP_RADIUS < 0) {
            this.dy = -this.dy;
        }
        this.x += this.dx;
        this.y += this.dy;

        this.draw();
  }
}

function Planet(x, y, radius, mass, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.mass = mass;
    this.color = color;

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
    mouse.x = event.x;
    mouse.y = event.y;
});

window.addEventListener('mousedown', function(event) {
    mouse.x = event.x;
    mouse.y = event.y;
    if (mouseDownInPlayer() && !ship.moving) {
        velocity.x1 = ship.x;
        velocity.y1 = ship.y;
        velocity.x2 = mouse.x;
        velocity.y2 = mouse.y;
        settingVelocity = true;
    }
});

window.addEventListener('mouseup', function(event) {
	mouse.x = event.x;
    mouse.y = event.y;
    if(settingVelocity) {
  	    var dv = velocity.getVelocity();
        ship.dx = dv.x;
        ship.dy = dv.y;
        ship.moving = true;
  	    settingVelocity = false;
    }
});

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

var ship = new Ship(100, 300);
var planet1 = new Planet(200, 150, 30, 3, '#ab5612');
var goal = new Goal(500, 200);
var velocity = new Velocity();

var objects = [ship, planet1, goal];

function init() {
    planet1.draw();
    ship.draw();
    goal.draw();
}

function animate() {
    requestAnimationFrame(animate);
    c.clearRect(0, 0, innerWidth, innerHeight);

	if(ship.moving) {
  	    var v = fg(planet1, ship);
  	     ship.addVelocity(v)
    }

    for (obj of objects) {
        obj.update();
    }

    if (settingVelocity) {
        velocity.changeDestination(mouse.x, mouse.y);
        velocity.update();
    }
}

init();
animate();
