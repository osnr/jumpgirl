# CONTROLS: Why don't you check out the keyPressed and keyReleased functions? ;-)
drawBackground = ->
  background 216, 245, 252

TILE_HEIGHT = 43
TILE_WIDTH = 100
SCREEN_ROWS = 7
SCREEN_COLS = 4
TILE_MAP = [[0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]]
TILE_MAP_ROWS = TILE_MAP.length
TILE_MAP_COLS = TILE_MAP[0].length

# enemies
ENEMY_MAP = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
GRAVITY = 2

# tile access
# -----------
tileFor = (tX, tY) ->
  if typeof tX is "object"
    
    # someone passed in tileFor([tX, tY])
    tY = tX[1]
    tX = tX[0]
  if tY < TILE_MAP_ROWS and tX < TILE_MAP_COLS and tY >= 0 and tX >= 0
    TILE_MAP[tY][tX]
  else if tY < 0
    
    # this tile is above the screen, so it's open space
    0
  else
    
    # this tile is impassable
    -1


# turns some point (x, y) into the (tX, tY) covering that point
tileCoordsForPoint = (x, y) ->
  if typeof x is "object"
    
    # passed [x, y]
    y = x[1]
    x = x[0]
  [floor(x / TILE_WIDTH), floor(y / TILE_HEIGHT)]

tileForPoint = (x, y) ->
  tileCoords = tileCoordsForPoint(x, y)
  tX = tileCoords[0]
  tY = tileCoords[1]
  tileFor tX, tY

rectIntersectsRect = (x1, y1, w1, h1, x2, y2, w2, h2) ->
  (((x1 <= x2) and (x2 <= x1 + w1)) or ((x2 <= x1) and (x1 <= x2 + w2))) and (((y1 <= y2) and (y2 <= y1 + h1)) or ((y2 <= y1) and (y1 <= y2 + h2)))

rectIntersectsTile = (x, y, w, h, tX, tY) ->
  rectIntersectsRect x, y, w, h, tX * TILE_WIDTH, tY * TILE_HEIGHT, tX * TILE_WIDTH + TILE_WIDTH, tY * TILE_HEIGHT + TILE_HEIGHT

dudeIntersectsTile = (dude, tX, tY) ->
  rectIntersectsTile dude.x + dude.cXOffset, dude.y + dude.cYOffset, dude.cWidth, dude.cHeight, tX, tY

dudeIntersectsDude = (dude1, dude2) ->
  rectIntersectsRect dude1.x + dude1.cXOffset, dude1.y + dude1.cYOffset, dude1.cWidth, dude1.cHeight, dude2.x + dude2.cXOffset, dude2.y + dude2.cYOffset, dude2.cWidth, dude2.cHeight

t = 0
gameOver = false
scrollX = 0
scrollY = 0
animMap = {}
tileImages =
  1: getImage("cute/DirtBlock")
  2: getImage("cute/WoodBlock")
  3: getImage("cute/PlainBlock")
  4: getImage("cute/ChestOpen")

animFor = (tX, tY) ->
  if tY of animMap and tX of animMap[tY]
    anim = animMap[tY][tX]
    if anim.type is "powerup"
      anim.yOffset = anim.t * anim.t - 6 * anim.t
      delete animMap[tY][tX]  if anim.t > 0 and anim.yOffset is 0
    anim.t += 1
    anim

drawTile = (tX, tY) ->
  anim = animFor(tX, tY)
  if anim
    image tileImages[anim.tile], TILE_WIDTH * tX + scrollX + anim.xOffset, TILE_HEIGHT * tY + scrollY + anim.yOffset
  else
    tileImage = tileImages[tileFor(tX, tY)]
    return  unless tileImage
    image tileImages[tileFor(tX, tY)], TILE_WIDTH * tX + scrollX, TILE_HEIGHT * tY + scrollY

dudeImages =
  1: getImage("cute/CharacterHornGirl")
  2: getImage("cute/EnemyBug")

powerImages = armed: getImage("avatars/leaf-blue")
hero =
  
  # these are properties that all kinds of characters have
  # including the hero
  x: 0
  y: 0
  xVelocity: 0
  yVelocity: 0
  wounded: false
  lastWounded: 0
  cXOffset: 20
  cWidth: TILE_WIDTH - 40
  cYOffset: 0
  cHeight: TILE_HEIGHT
  im: 1
  
  # only the hero has the following properties, though
  jump: 0 # increases as you hold down JUMP, so a brief tap !== a long press
  running: false
  facesLeft: false
  ySway: 0
  power: "none"
  dead: false
  rotation: 0

hitPowerup = (tX, tY) ->
  animMap[tY] = {}  unless tY of animMap
  animMap[tY][tX] =
    tile: tileFor(tX, tY)
    type: "powerup"
    xOffset: 0
    yOffset: 0
    t: 0

  hero.power = "armed"  if hero.power is "none"

drawDude = (dude) ->
  mod = undefined
  
  # blink if wounded
  return  if dude.wounded and not dude.dead and round(t / 3) % 2 is 0
  if dude.xVelocity isnt 0
    if dude.xVelocity < 0
      dude.facesLeft = true
    else dude.facesLeft = false  if dude.xVelocity > 0
    if dude.yVelocity is 0
      if dude.ySway is 0
        dude.ySway = 1
      else
        if dude.running
          mod = 3
        else
          mod = 4
        dude.ySway = -dude.ySway  if (t % mod) is 0
  else
    dude.ySway = 0
  img = dudeImages[dude.im]
  x = dude.x + scrollX
  y = dude.y + scrollY + dude.ySway
  dying = dude.dead and (dude.y + scrollY) < height
  if dying
    pushMatrix()
    dude.rotation += 100 * sin(10 * frameCount)  if dude.yVelocity <= 0
    translate x + img.width / 2, y + img.height / 2
    rotate dude.rotation
    translate -x - img.width / 2, -y - img.height / 2
  if dude.facesLeft
    pushMatrix()
    scale -1, 1
    image img, -x - img.width, y
    popMatrix()
  else
    image img, x, y
  image powerImages[dude.power], dude.x + scrollX, dude.y + scrollY + dude.ySway  if dude.power and dude.power isnt "none"
  popMatrix()  if dying


# sectumsempra
# ------------
enemies = []
loadEnemy = (id, tX, tY) ->
  im = undefined
  return  if id is 0
  enemies.push
    x: tX * TILE_WIDTH
    y: tY * TILE_HEIGHT
    xVelocity: 0
    yVelocity: 0
    wounded: false
    im: id
    ySway: 0
    cXOffset: 0
    cWidth: TILE_WIDTH
    cYOffset: 0
    cHeight: TILE_HEIGHT


loadEnemies = ->
  tY = 0

  while tY < TILE_MAP_ROWS
    tX = 0

    while tX < TILE_MAP_COLS
      loadEnemy ENEMY_MAP[tY][tX], tX, tY  if ENEMY_MAP[tY][tX] isnt 0
      tX += 1
    tY += 1

loadEnemies()
drawEnemies = ->
  i = 0

  while i < enemies.length
    drawDude enemies[i]
    i += 1


# drawing
# -------
drawMapBelowHero = ->
  heroRow = max(floor(hero.y / TILE_HEIGHT), 0)
  
  # have to draw rows at the bottom first, and go upward
  tY = TILE_MAP_ROWS - 1

  while tY >= heroRow
    tX = 0

    while tX < TILE_MAP_COLS
      drawTile tX, tY
      tX += 1
    tY -= 1

drawMapAboveHero = ->
  
  # have to draw rows at the bottom first, and go upward
  heroRow = floor(hero.y / TILE_HEIGHT)
  if heroRow >= 0
    tY = heroRow

    while tY >= 0
      tX = 0

      while tX < TILE_MAP_COLS
        drawTile tX, tY
        tX += 1
      tY -= 1


# collisions
# ----------

# tiles adjacent to dudes
tileCoordsAdj = (dude, dir, amt) ->
  x = undefined
  y = undefined
  amt = amt or 1
  if dir is "left"
    x = dude.x + dude.cXOffset - amt
    y = dude.y + dude.cYOffset
  else if dir is "right"
    x = dude.x + dude.cXOffset + dude.cWidth + amt
    y = dude.y + dude.cYOffset
  else if dir is "below left"
    x = dude.x + dude.cXOffset
    y = dude.y + dude.cYOffset + dude.cHeight + amt
  else if dir is "below right"
    x = dude.x + dude.cXOffset + dude.cWidth
    y = dude.y + dude.cYOffset + dude.cHeight + amt
  else if dir is "above left"
    x = dude.x + dude.cXOffset
    y = dude.y + dude.cYOffset - amt
  else if dir is "above right"
    x = dude.x + dude.cXOffset + dude.cWidth
    y = dude.y + dude.cYOffset - amt
  tileCoordsForPoint x, y

tileAdj = (dude, dir, amt) ->
  tileFor tileCoordsAdj(dude, dir, amt)


# tile checks
tileIsBlocking = (tile) ->
  tile isnt 0

tileIsPowerup = (tile) ->
  tile is 3

tileAdjIsBlocking = (dude, dir, amt) ->
  if dir is "left" or dir is "right"
    tileIsBlocking tileAdj(dude, dir, amt)
  else tileIsBlocking(tileAdj(dude, dir + " left", amt)) or tileIsBlocking(tileAdj(dude, dir + " right", amt))  if dir is "below" or dir is "above"

checkXCollisions = (dude) ->
  
  # FIXME jump into block above you bug
  if tileAdjIsBlocking(dude, "left") and dude.xVelocity < 0
    dude.xVelocity = 0
    dude.x += 1  while tileAdjIsBlocking(dude, "left") and not tileAdjIsBlocking(dude, "right")
  else if tileAdjIsBlocking(dude, "right") and dude.xVelocity > 0
    dude.xVelocity = 0
    dude.x -= 1  while tileAdjIsBlocking(dude, "right") and not tileAdjIsBlocking(dude, "left")

checkYCollisions = (dude) ->
  tal = undefined
  tar = undefined
  curTile = tileCoordsForPoint(dude.x, dude.y)
  if tileAdjIsBlocking(dude, "below") and dude.yVelocity > 0
    dude.yVelocity = 0
    dude.y -= 1  while tileAdjIsBlocking(dude, "below")
  else if tileAdjIsBlocking(dude, "above") and dude.yVelocity < 0
    dude.yVelocity = dude.yVelocity * -1 / 2
    tal = tileCoordsAdj(dude, "above left")
    if tileIsPowerup(tileFor(tal))
      hitPowerup tal[0], tal[1]
    else
      tar = tileCoordsAdj(dude, "above right")
      hitPowerup tar[0], tar[1]  if tileIsPowerup(tileFor(tal))
    dude.y += 1  while tileAdjIsBlocking(dude, "above")


# input
# -----
keyJump = false
keyLeft = false
keyRight = false
keyPressed = ->
  if keyCode is 32 # 32 is the keyCode for space
    keyJump = true
  else if keyCode is SHIFT
    hero.running = true
  else if keyCode is LEFT
    keyLeft = true
  else keyRight = true  if keyCode is RIGHT

keyReleased = ->
  if keyCode is 32
    keyJump = false
  else if keyCode is SHIFT
    hero.running = false
  else if keyCode is LEFT
    keyLeft = false
  else keyRight = false  if keyCode is RIGHT


# hero update stuff
# -----------------
maxHeroSpeed = ->
  if hero.running
    15
  else
    9

updateHeroXVelocity = ->
  if keyRight
    hero.xVelocity = 0  if hero.xVelocity < 0
    hero.xVelocity += 1
  else if keyLeft
    hero.xVelocity = 0  if hero.xVelocity > 0
    hero.xVelocity -= 1
  else
    if hero.xVelocity > 0
      hero.xVelocity -= 0.5
    else hero.xVelocity += 0.5  if hero.xVelocity < 0
  if hero.xVelocity > maxHeroSpeed()
    hero.xVelocity = 9
  else hero.xVelocity = -9  if hero.xVelocity < -maxHeroSpeed()

updateHeroYVelocity = ->
  if keyJump
    hero.jump = 1  if hero.yVelocity is 0 and tileAdjIsBlocking(hero, "below", 2)
    if hero.jump > 0 and hero.jump < 10
      hero.jump += 1
      hero.yVelocity -= 6
  hero.jump = 0  if not keyJump or hero.jump >= 10
  if hero.yVelocity < -18 # max jump speed
    hero.yVelocity = -18
  # terminal velocity
  # (this is as fast as you can ever fall)
  else hero.yVelocity = 30  if hero.yVelocity > 30

killHero = ->
  hero.yVelocity -= 100
  hero.dead = true

woundHero = ->
  hero.wounded = true
  hero.lastWounded = t
  if hero.power isnt "none"
    hero.power = "none"
  else
    killHero()

checkEnemyCollisions = ->
  
  # this is intentionally under hero stuff,
  # because it's centered around the hero
  # (I guess it's arguable)
  return  if hero.wounded
  i = 0

  while i < enemies.length
    if dudeIntersectsDude(hero, enemies[i])
      if hero.yVelocity > 0
        
        # enemy's being jumped on
        hero.yVelocity -= 30
        enemies.splice i, 1
      else
        
        # enemy hit us!
        woundHero()
    i += 1

updateHero = ->
  updateHeroXVelocity()
  updateHeroYVelocity()
  hero.yVelocity += GRAVITY
  hero.x += hero.xVelocity
  hero.y += hero.yVelocity
  if hero.dead
    gameOver = true  if hero.y + scrollY + dudeImages[hero.im].height > height
  else
    checkXCollisions hero
    checkYCollisions hero
    checkEnemyCollisions()

scroll = ->
  scrollX -= floor(hero.xVelocity)  if (hero.x + scrollX > width / 2 and hero.xVelocity > 0) or (hero.x + scrollX < width / 2 and hero.xVelocity < 0)
  (hero.y + scrollY > height / 2 and hero.yVelocity > 0) or (hero.y + scrollY < height / 2 and hero.yVelocity < 0)


#scrollY -= floor(hero.yVelocity);

# enemy update
# ------------
updateEnemies = ->
  enemy = undefined
  i = 0

  while i < enemies.length
    enemy = enemies[i]
    enemy.yVelocity += GRAVITY
    enemy.x += enemy.xVelocity
    enemy.y += enemy.yVelocity
    checkXCollisions enemy
    checkYCollisions enemy
    i += 1


# game-wide updates
# -----------------
update = ->
  updateHero()
  updateEnemies()
  scroll()

drawDebugInfo = (scaleFactor) ->
  
  # TODO make this function clean
  # (it was never intended to be permanent)
  
  # draw a minimap of everything at 1/10 scale
  # draw the whole tilemap
  noStroke()
  fill 255, 255, 255
  rect 0, 0, TILE_MAP_COLS * TILE_WIDTH * scaleFactor, TILE_MAP_ROWS * TILE_HEIGHT * scaleFactor
  tY = 0

  while tY < TILE_MAP_ROWS
    tX = 0

    while tX < TILE_MAP_COLS
      if tileFor(tX, tY) isnt 0
        fill 0, 0, 0
        rect tX * TILE_WIDTH * scaleFactor, tY * TILE_HEIGHT * scaleFactor, TILE_WIDTH * scaleFactor, TILE_HEIGHT * scaleFactor
      tX += 1
    tY += 1
  fill 0, 0, 255
  rect hero.x * scaleFactor, hero.y * scaleFactor, TILE_WIDTH * scaleFactor, TILE_HEIGHT * scaleFactor
  fill 255, 0, 0
  i = 0

  while i < enemies.length
    rect enemies[i].x * scaleFactor, enemies[i].y * scaleFactor, TILE_WIDTH * scaleFactor, TILE_HEIGHT * scaleFactor
    i += 1
  
  # draw the onscreen part
  noFill()
  stroke 0, 0, 255
  rect -scrollX * scaleFactor, -scrollY * scaleFactor, SCREEN_COLS * TILE_WIDTH * scaleFactor, SCREEN_ROWS * TILE_HEIGHT * scaleFactor

timer = ->
  hero.wounded = false  if hero.wounded and t - hero.lastWounded > 60
  t += 1

tGameOver = 0
drawGameOver = ->
  if tGameOver is 255
    fill 255, 0, 0
    text "GAME OVER", width / 2, height / 2
  else
    fill 0, 0, 0, tGameOver
    rect 0, 0, width, height
  tGameOver += 1

draw = ->
  update()
  drawBackground()
  drawMapBelowHero()
  drawEnemies()
  drawDude hero
  drawMapAboveHero()
  drawDebugInfo 1 / 10
  drawGameOver()  if gameOver
  timer()