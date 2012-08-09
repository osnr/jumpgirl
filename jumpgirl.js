// CONTROLS: Why don't you check out the keyPressed and keyReleased functions? ;-)

var drawBackground = function() {
    background(216, 245, 252);
};

var TILE_HEIGHT = 43;
var TILE_WIDTH = 100;

var SCREEN_ROWS = 7;
var SCREEN_COLS = 4;

var TILE_MAP = [
[0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];
var TILE_MAP_ROWS = TILE_MAP.length;
var TILE_MAP_COLS = TILE_MAP[0].length;

// enemies
var ENEMY_MAP = [
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

var GRAVITY = 2;

var animMap = [];

// tile access
// -----------
var tileFor = function(tX, tY) {
    if (typeof tX === "object") {
        // someone passed in tileFor([tX, tY])
        tY = tX[1];
        tX = tX[0];
    }

    if (tY < TILE_MAP_ROWS && tX < TILE_MAP_COLS && tY >= 0 && tX >= 0) {
        return TILE_MAP[tY][tX];
    } else if (tY < 0) {
        // this tile is above the screen, so it's open space
        return 0;
    } else {
        // this tile is impassable
        return -1;
    }
};

// turns some point (x, y) into the (tX, tY) covering that point
var tileCoordsForPoint = function(x, y) {
    if (typeof x === "object") {
        // passed [x, y]
        y = x[1];
        x = x[0];
    }
    return [floor(x / TILE_WIDTH), floor(y / TILE_HEIGHT)];
};

var tileForPoint = function(x, y) {
    var tileCoords = tileCoordsForPoint(x, y),
    tX = tileCoords[0],
    tY = tileCoords[1];
    
    return tileFor(tX, tY);
};

var rectIntersectsRect = function(x1, y1, w1, h1, x2, y2, w2, h2) {
    return ( ((x1 <= x2) && (x2 <= x1 + w1)) ||
             ((x2 <= x1) && (x1 <= x2 + w2)) ) &&
           ( ((y1 <= y2) && (y2 <= y1 + h1)) ||
             ((y2 <= y1) && (y1 <= y2 + h2)) );
};

var rectIntersectsTile = function(x, y, w, h, tX, tY) {
    return rectIntersectsRect(x, y, w, h,
    
        tX * TILE_WIDTH,
        tY * TILE_HEIGHT,
        tX * TILE_WIDTH + TILE_WIDTH,
        tY * TILE_HEIGHT + TILE_HEIGHT);
};

var dudeIntersectsTile = function(dude, tX, tY) {
    return rectIntersectsTile(
        dude.x + dude.cXOffset,
        dude.y + dude.cYOffset,
        dude.cWidth,
        dude.cHeight,
        
        tX, tY);
};

var dudeIntersectsDude = function(dude1, dude2) {
    return rectIntersectsRect(
        dude1.x + dude1.cXOffset,
        dude1.y + dude1.cYOffset,
        dude1.cWidth,
        dude1.cHeight,
        
        dude2.x + dude2.cXOffset,
        dude2.y + dude2.cYOffset,
        dude2.cWidth,
        dude2.cHeight);
};

var t = 0;

var scrollX = 0, scrollY = 0;

var animMap = [];

var tileImages = {
    1: getImage("cute/DirtBlock"),
    2: getImage("cute/WoodBlock"),
    3: getImage("cute/PlainBlock"),
    4: getImage("cute/ChestOpen")
};

var animFor = function(tX, tY) {
    if (tY in animMap && tX in animMap[tY]) {
        var anim = animMap[tY][tX];

        if (anim.type === "powerup") {
            anim.yOffset -= 1;
        }

        return anim;
    }
};

var drawTile = function(tX, tY) {
    var anim = animFor(tX, tY);
    if (anim) {
        image(tileImages[anim.tile], TILE_WIDTH * tX + scrollX + anim.xOffset, TILE_HEIGHT * tY + scrollY + anim.yOffset);

    } else {
        var tileImage = tileImages[tileFor(tX, tY)];

        if (!tileImage) {
            return;
        }

        image(tileImages[tileFor(tX, tY)], TILE_WIDTH * tX + scrollX, TILE_HEIGHT * tY + scrollY);
    }
};

var hitPowerup = function(tX, tY) {
    if (!(tY in animMap)) {
        animMap[tY] = [];
    }

    animMap[tY][tX] = {
        tile: tileFor(tX, tY),
        type: "powerup",

        xOffset: 0,
        yOffset: 0
    };
};

var hero = {
    // these are properties that all kinds of characters have
    // including the hero
    x: 0,
    y: 0,

    xVelocity: 0,
    yVelocity: 0,

    wounded: false,
    lastWounded: 0,

    cXOffset: 20,
    cWidth: TILE_WIDTH - 40,
    cYOffset: 0,
    cHeight: TILE_HEIGHT,

    im: getImage("cute/CharacterHornGirl"),

    // only the hero has the following properties, though
    jump: 0, // increases as you hold down JUMP, so a brief tap !== a long press
    running: false,

    facesLeft: false,
    ySway: 0
};

var drawDude = function(dude) {
    var mod;
    
    if (dude.wounded && round(t / 3) % 2 === 0) {
        return;
    }
    
    if (dude.xVelocity !== 0) {
        if (dude.xVelocity < 0) {
            dude.facesLeft = true;
        } else if (dude.xVelocity > 0) {
            dude.facesLeft = false;
        }
        
        if (dude.yVelocity === 0) {
            if (dude.ySway === 0) {
                dude.ySway = 1;
            } else {
                if (dude.running) {
                    mod = 3;
                } else {
                    mod = 4;
                }
                
                if ((t % mod) === 0) {
                    dude.ySway = -dude.ySway;
                }
            }
        }
    } else {
        dude.ySway = 0;
    }
    
    if (dude.facesLeft) {
        pushMatrix();
        scale(-1, 1);
        image(dude.im, -(dude.x + scrollX + dude.im.width), dude.y + scrollY + dude.ySway);
        popMatrix();
    } else {
        image(dude.im, dude.x + scrollX, dude.y + scrollY + dude.ySway);
    }
};

// sectumsempra
// ------------
var enemies = [];

var loadEnemy = function(id, tX, tY) {
    var im;
    
    if (id === 1) {
        im = getImage("cute/EnemyBug");
    } else {
        return;
    }
    
    enemies.push({
        x: tX * TILE_WIDTH,
        y: tY * TILE_HEIGHT,
        
        xVelocity: 0,
        yVelocity: 0,
        
        wounded: false,
        
        im: im,
        
        ySway: 0,
        
        cXOffset: 0,
        cWidth: TILE_WIDTH,
        cYOffset: 0,
        cHeight: TILE_HEIGHT
    });
};

var loadEnemies = function() {
    for (var tY = 0; tY < TILE_MAP_ROWS; tY += 1) {
        for (var tX = 0; tX < TILE_MAP_COLS; tX += 1) {
            if (ENEMY_MAP[tY][tX] !== 0) {
                loadEnemy(ENEMY_MAP[tY][tX], tX, tY);
            }
        }
    }
};

loadEnemies();

var drawEnemies = function() {
    for (var i = 0; i < enemies.length; i += 1) {
        drawDude(enemies[i]);
    }
};


// drawing
// -------
var drawMapBelowHero = function() {
    var heroRow = max(floor(hero.y / TILE_HEIGHT), 0);
    // have to draw rows at the bottom first, and go upward
    for (var tY = TILE_MAP_ROWS - 1; tY >= heroRow; tY -= 1) {
        for (var tX = 0; tX < TILE_MAP_COLS; tX += 1) {
            drawTile(tX, tY);
        }
    }
};
var drawMapAboveHero = function() {
    // have to draw rows at the bottom first, and go upward
    var heroRow = floor(hero.y / TILE_HEIGHT);
    
    if (heroRow >= 0) {
        for (var tY = heroRow; tY >= 0; tY -= 1) {
            for (var tX = 0; tX < TILE_MAP_COLS; tX += 1) {
                drawTile(tX, tY);
            }
        }
    }
};

// collisions
// ----------

// tiles adjacent to dudes
var tileCoordsAdj = function(dude, dir, amt) {
    var x, y;
    amt = amt || 1;

    if (dir === "left") {
        x = dude.x + dude.cXOffset - amt;
        y = dude.y + dude.cYOffset;
    } else if (dir === "right") {
        x = dude.x + dude.cXOffset + dude.cWidth + amt;
        y = dude.y + dude.cYOffset;
    } else if (dir === "below left") {
        x = dude.x + dude.cXOffset;
        y = dude.y + dude.cYOffset + dude.cHeight + amt;
    } else if (dir === "below right") {
        x = dude.x + dude.cXOffset + dude.cWidth;
        y = dude.y + dude.cYOffset + dude.cHeight + amt;
    } else if (dir === "above left") {
        x = dude.x + dude.cXOffset;
        y = dude.y + dude.cYOffset - amt;
    } else if (dir === "above right") {
        x = dude.x + dude.cXOffset + dude.cWidth;
        y = dude.y + dude.cYOffset - amt;
    }
    
    return tileCoordsForPoint(x, y);
};

var tileAdj = function(dude, dir, amt) {
    return tileFor(tileCoordsAdj(dude, dir, amt));
};

// tile checks
var tileIsBlocking = function(tile) {
    return tile !== 0;
};

var tileIsPowerup = function(tile) {
    return tile === 3;
};

var tileAdjIsBlocking = function(dude, dir, amt) {
    if (dir === "left" || dir === "right") {
        return tileIsBlocking(tileAdj(dude, dir, amt));

    } else if (dir === "below" || dir === "above") {
        return tileIsBlocking(tileAdj(dude, dir + " left", amt)) ||
            tileIsBlocking(tileAdj(dude, dir + " right", amt));
    }
};

var checkXCollisions = function(dude) {
    // FIXME jump into block above you bug
    if (tileAdjIsBlocking(dude, "left") && dude.xVelocity < 0) {
        dude.xVelocity = 0;
        while (tileAdjIsBlocking(dude, "left") && !tileAdjIsBlocking(dude, "right")) {
            dude.x += 1;
        }
    } else if (tileAdjIsBlocking(dude, "right") && dude.xVelocity > 0) {
        dude.xVelocity = 0;
        while (tileAdjIsBlocking(dude, "right") && !tileAdjIsBlocking(dude, "left")) {
            dude.x -= 1;
        }
    }
};

var checkYCollisions = function(dude) {
    var tal, tar;
    var curTile = tileCoordsForPoint(dude.x, dude.y);
    if (tileAdjIsBlocking(dude, "below") && dude.yVelocity > 0) {
        dude.yVelocity = 0;
        while (tileAdjIsBlocking(dude, "below")) {
            dude.y -= 1;
        }
    } else if (tileAdjIsBlocking(dude, "above") && dude.yVelocity < 0) {
        dude.yVelocity = dude.yVelocity * -1/2;

        tal = tileCoordsAdj(dude, "above left");
        if (tileIsPowerup(tileFor(tal))) {
            hitPowerup(tal);
        } else {
            tar = tileCoordsAdj(dude, "above right");
            if (tileIsPowerup(tileFor(tal))) {
                hitPowerup(tar);
            }
        }

        while (tileAdjIsBlocking(dude, "above")) {
            dude.y += 1;
        }
    }
};

// input
// -----
var keyJump = false, keyLeft = false, keyRight = false;
var keyPressed = function() {
    if (keyCode === 32) { // 32 is the keyCode for space
        keyJump = true;
    } else if (keyCode === SHIFT) {
        hero.running = true;
    } else if (keyCode === LEFT) {
        keyLeft = true;
    } else if (keyCode === RIGHT) {
        keyRight = true;
    }
};
var keyReleased = function() {
    if (keyCode === 32) {
        keyJump = false;
    } else if (keyCode === SHIFT) {
        hero.running = false;
    } else if (keyCode === LEFT) {
        keyLeft = false;
    } else if (keyCode === RIGHT) {
        keyRight = false;
    }
};

// hero update stuff
// -----------------
var maxHeroSpeed = function() {
    if (hero.running) {
        return 15;
    } else {
        return 9;
    }
};

var updateHeroXVelocity = function() {
    if (keyRight) {
        if (hero.xVelocity < 0) {
            hero.xVelocity = 0;
        }
        hero.xVelocity += 1;
    } else if (keyLeft) {
        if (hero.xVelocity > 0) {
            hero.xVelocity = 0;
        }
        hero.xVelocity -= 1;
    } else {
        if (hero.xVelocity > 0) {
            hero.xVelocity -= 0.5;
        } else if (hero.xVelocity < 0) {
            hero.xVelocity += 0.5;
        }
    }

    if (hero.xVelocity > maxHeroSpeed()) {
        hero.xVelocity = 9;
    } else if (hero.xVelocity < -maxHeroSpeed()) {
        hero.xVelocity = -9;
    }
};

var updateHeroYVelocity = function() {
    if (keyJump) {
        if (hero.yVelocity === 0 && tileAdjIsBlocking(hero, "below", 2)) {
            hero.jump = 1;
        }
            
        if (hero.jump > 0 && hero.jump < 10) {
            hero.jump += 1;
            hero.yVelocity -= 6;
        }
    }

    if (!keyJump || hero.jump >= 10) {
        hero.jump = 0;
    }
    
    if (hero.yVelocity < -18) { // max jump speed
        hero.yVelocity = -18;
    } else if (hero.yVelocity > 30) { // terminal velocity
        // (this is as fast as you can ever fall)
        hero.yVelocity = 30;
    }
    
    hero.yVelocity += GRAVITY;
};

var checkEnemyCollisions = function() {
    // this is intentionally under hero stuff,
    // because it's centered around the hero
    // (I guess it's arguable)
    if (hero.wounded) {
        return;
    }
    
    for (var i = 0; i < enemies.length; i += 1) {
        if (dudeIntersectsDude(hero, enemies[i])) {
            if (hero.yVelocity > 0) {
                // enemy's being jumped on
                hero.yVelocity -= 30;
                enemies.splice(i, 1);
            } else {
                // enemy hit us!
                hero.wounded = true;
                hero.lastWounded = t;
            }
        }
    }    
};

var updateHero = function() {
    updateHeroXVelocity();
    updateHeroYVelocity();
    
    hero.x += hero.xVelocity;
    hero.y += hero.yVelocity;

    checkXCollisions(hero);
    checkYCollisions(hero);
    
    checkEnemyCollisions();
};

var scroll = function() {
    if ((hero.x + scrollX > width / 2 && hero.xVelocity > 0) ||
        (hero.x + scrollX < width / 2 && hero.xVelocity < 0)) {
        scrollX -= floor(hero.xVelocity);
    }

    if ((hero.y + scrollY > height / 2 && hero.yVelocity > 0) ||
        (hero.y + scrollY < height / 2 && hero.yVelocity < 0)) {
        //scrollY -= floor(hero.yVelocity);
    }
};

// enemy update
// ------------
var updateEnemies = function() {
    var enemy;
    for (var i = 0; i < enemies.length; i += 1) {
        enemy = enemies[i];

        enemy.yVelocity += GRAVITY;
        
        enemy.x += enemy.xVelocity;
        enemy.y += enemy.yVelocity;

        checkXCollisions(enemy);
        checkYCollisions(enemy);
    }
};

// game-wide updates
// -----------------
var update = function() {
    updateHero();
    updateEnemies();

    scroll();
};

var drawDebugInfo = function(scaleFactor) {
    // draw a minimap of everything at 1/10 scale
    // draw the whole tilemap
    noStroke();
    fill(255, 255, 255);
    rect(0, 0, TILE_MAP_COLS*TILE_WIDTH*scaleFactor, TILE_MAP_ROWS*TILE_HEIGHT*scaleFactor);
    
    for (var tY = 0; tY < TILE_MAP_ROWS; tY += 1) {
        for (var tX = 0; tX < TILE_MAP_COLS; tX += 1) {
            if (tileFor(tX, tY) !== 0) {
                fill(0, 0, 0);
                rect(tX*TILE_WIDTH*scaleFactor, tY*TILE_HEIGHT*scaleFactor, TILE_WIDTH*scaleFactor, TILE_HEIGHT*scaleFactor);
            }
        }
    }
    
    fill(0, 0, 255);
    rect(hero.x*scaleFactor, hero.y*scaleFactor, TILE_WIDTH*scaleFactor, TILE_HEIGHT*scaleFactor);
    
    fill(255, 0, 0);
    for (var i = 0; i < enemies.length; i += 1) {
        rect(enemies[i].x*scaleFactor, enemies[i].y*scaleFactor, TILE_WIDTH*scaleFactor, TILE_HEIGHT*scaleFactor);
    }
    
    // draw the onscreen part
    noFill();
    stroke(0, 0, 255);
    rect(-scrollX*scaleFactor, -scrollY*scaleFactor, SCREEN_COLS*TILE_WIDTH*scaleFactor, SCREEN_ROWS*TILE_HEIGHT*scaleFactor);
};

var timer = function() {
    if (hero.wounded && t - hero.lastWounded > 60) {
        hero.wounded = false;
    }
    t += 1;
};

var draw = function() {
    update();
    
    drawBackground();
    drawMapBelowHero();
    drawEnemies();
    drawDude(hero);
    drawMapAboveHero();
    
    drawDebugInfo(1/10);

    timer();
};
