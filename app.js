const map2d = [
  '#','#','#','#','#','#','#','#','#','#','#','#','#','#','#','#','#','#','#','#',
  '#','.','.','.','.','.','.','#','.','.','.','.','.','#','.','.','#','.','.','#',
  '#','.','.','.','.','.','.','#','.','.','.','.','.','#','.','.','#','.','#','#',
  '#','.','.','.','.','.','.','#','.','.','.','.','.','.','.','.','.','.','.','#',
  '#','#','#','.','.','#','#','#','.','.','.','.','.','.','.','.','.','#','#','#',
  '#','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','#',
  '#','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','#',
  '#','.','.','#','#','#','#','#','.','.','.','.','.','.','.','.','.','.','.','#',
  '#','.','.','#','.','.','.','#','.','.','.','.','.','#','#','#','#','#','#','#',
  '#','.','.','#','.','.','.','#','.','.','.','.','.','#','.','.','.','.','.','#',
  '#','.','#','#','.','.','.','#','#','.','.','.','.','#','.','#','#','#','.','#',
  '#','.','.','.','.','.','.','.','.','.','.','.','.','#','.','#','#','#','#','#',
  '#','.','.','.','.','.','.','.','.','.','.','.','.','#','.','.','.','.','.','#',
  '#','.','#','.','#','.','#','.','#','.','.','.','.','#','#','#','#','#','.','#',
  '#','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','#',
  '#','.','.','#','.','#','.','#','.','.','.','.','.','#','.','.','.','.','.','#',
  '#','.','.','.','.','.','.','.','.','.','.','.','.','#','#','#','.','.','.','#',
  '#','.','#','.','#','.','#','.','#','.','.','.','.','#','.','.','.','.','.','#',
  '#','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','.','#',
  '#','#','#','#','#','#','#','#','#','#','#','#','#','#','#','#','#','#','#','#',
]

const WIN_HEIGHT = window.innerHeight - 4
const WIN_WIDTH = window.innerWidth
const VIEW_WIDTH = WIN_WIDTH / 2
const MAP_WIDTH = 20
const MAP_HEIGHT = 20

const TILE_WIDTH = Math.floor(VIEW_WIDTH / MAP_WIDTH)
const TILE_HEIGHT = Math.floor(WIN_HEIGHT / MAP_HEIGHT)

const FOV = Math.PI / 3
const FORWARD_STEP = 6

class Point {
  constructor(x, y) {
    this.x = x
    this.y = y
  }
}

class Player extends Point {
  constructor(x, y, angle, fov) {
    super(x, y)
    this.angle = angle
    this.fov = fov
  }
}

let player = new Player(
  3 * TILE_WIDTH + TILE_WIDTH / 2,
  2 * TILE_WIDTH + TILE_WIDTH / 2,
  0,
  FOV
)

function setup() {
  createCanvas(WIN_WIDTH, WIN_HEIGHT)
}

function draw() {
  background(255)

  draw_grid()

  draw_player()

  raycast()

  watch_key_presses()

  // watch_mouse_movements()
}

function draw_grid() {
  for (let i = 0; i < MAP_WIDTH; i++) {
    for (let j = 0; j < MAP_HEIGHT; j++) {
      if (map2d[j + i * MAP_WIDTH] == ".") {
        stroke(160)
        fill(255)
      } else {
        stroke(0)
        fill(0)
      }

      rect(j * TILE_WIDTH, i * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT)
    }
  }
}

function draw_player() {
  fill(0)
  rect(player.x - 5, player.y - 5, 10, 10)
}

function raycast() {
  const projectionDistance = VIEW_WIDTH / 2 / tan(player.fov)

  for (let i = 0; i < VIEW_WIDTH; i++) {
    const angle = (player.angle - player.fov / 2 + (player.fov * i) / VIEW_WIDTH) % TWO_PI

    const cast_angle = (angle + TWO_PI) % TWO_PI
    const is_bottom = cast_angle > 0 && cast_angle < PI
    const is_right =
      (cast_angle >= 0 && cast_angle < PI / 2) ||
      (cast_angle > (PI * 3) / 2 && cast_angle <= TWO_PI)

    const H = find_h_intersection(is_bottom, angle)
    const hDistance = dist(player.x, player.y, H.x, H.y)

    const V = find_v_intersection(is_right, angle)
    const vDistance = dist(player.x, player.y, V.x, V.y)

    let distance = cos(player.angle - angle)
    stroke(74, 202, 128, 50)
    if (hDistance <= vDistance) {
      line(player.x, player.y, H.x, H.y)
      distance *= hDistance
    } else {
      line(player.x, player.y, V.x, V.y)
      distance *= vDistance
    }

    let columnHeight = (100 * projectionDistance) / distance
    draw_column(i, columnHeight, distance)
  }
}

function find_h_intersection(is_bottom, angle) {
  const A = new Point()

  A.y = floor(player.y / TILE_HEIGHT) * TILE_HEIGHT
  if (is_bottom) {
    A.y += TILE_HEIGHT
  } else {
    A.y -= 0.01
  }
  A.x = player.x + (A.y - player.y) / tan(angle)
  // draw_rays_and_collisions(player, A, [128, 202, 34])

  let A_dy = TILE_HEIGHT
  if (! is_bottom) A_dy *= -1
  let A_dx = A_dy / tan(angle)

  while (A.x >= 0 && A.x < VIEW_WIDTH && A.y >= 0 && A.y < WIN_HEIGHT) {
    if (collides_with_wall(A)) {
      return A
    }

    A.x += A_dx
    A.y += A_dy
  }

  return new Point(VIEW_WIDTH * 2, WIN_HEIGHT * 2)
}

function find_v_intersection(is_right, angle) {
  const B = new Point()

  B.x = floor(player.x / TILE_WIDTH) * TILE_WIDTH
  if (is_right) {
    B.x += TILE_WIDTH
  } else {
    B.x -= 0.01
  }
  B.y = player.y + (B.x - player.x) * tan(angle)
  // draw_rays_and_collisions(player, B, [202, 34, 128])

  let B_dx = TILE_WIDTH
  if (! is_right) B_dx *= -1
  let B_dy = B_dx * tan(angle)

  while (B.x >= 0 && B.x < VIEW_WIDTH && B.y >= 0 && B.y < WIN_HEIGHT) {
    if (collides_with_wall(B)) {
      return B
    }

    B.x += B_dx
    B.y += B_dy
  }

  return new Point(VIEW_WIDTH * 2, WIN_HEIGHT * 2)
}

function draw_column(column, height, distance) {
  stroke(map(distance, 0, 500, 235, 40))
  line(
    VIEW_WIDTH + column,
    WIN_HEIGHT / 2 - height,
    VIEW_WIDTH + column,
    WIN_HEIGHT / 2 + height
  )
}

function draw_rays_and_collisions({ x: sx, y: sy }, { x: tx, y: ty }, color) {
  noStroke()
  stroke(...color, 50)
  line(sx, sy, tx, ty)
}

function collides_with_wall({ x, y }) {
  const row = floor(x / TILE_WIDTH)
  const column = floor(y / TILE_HEIGHT)

  if (! is_in_map_bounds(row, column)) {
    return
  }

  return map2d[row + column * MAP_WIDTH] != "."
}

function is_in_map_bounds(row, column, skip_edges = false) {
  return row >= 0+skip_edges && row < MAP_WIDTH-skip_edges && column >= 0+skip_edges && column < MAP_HEIGHT-skip_edges
}

function watch_key_presses() {
  if (keyPresses[65]) {
    player.angle -= (player.fov * 40) / VIEW_WIDTH
  }

  if (keyPresses[68]) {
    player.angle += (player.fov * 40) / VIEW_WIDTH
  }

  if (keyPresses[87]) {
    update_player_position(
      FORWARD_STEP * cos(player.angle),
      FORWARD_STEP * sin(player.angle)
    )
  }

  if (keyPresses[83]) {
    update_player_position(
      -FORWARD_STEP * cos(player.angle),
      -FORWARD_STEP * sin(player.angle)
    )
  }
}

function update_player_position(dx, dy) {
  if (! collides_with_wall(new Point(player.x + dx, player.y))) {
    player.x += dx
  }

  if (! collides_with_wall(new Point(player.x, player.y + dy))) {
    player.y += dy
  }
}

const keyPresses = {}
function keyPressed() {
  keyPresses[keyCode] = true
}

function keyReleased() {
  keyPresses[keyCode] = false
}

function mouseWheel(event) {
  player.fov = min(max(player.fov + map(event.delta, 0, 150, 0, PI / 64), PI/6), 2*PI/3)
}

toggled = undefined
function mousePressed() {
  toggled = new Set()
}

function mouseDragged() {
  toggle_current_cell()
}

function mouseReleased() {
  toggle_current_cell()
}

function toggle_current_cell() {
  const row = floor(mouseY / TILE_HEIGHT)
  const column = floor(mouseX / TILE_WIDTH)

  if (! is_in_map_bounds(row, column, true)) {
    return
  }

  const index = row*MAP_WIDTH + column
  if (toggled.has(index)) {
    return
  }

  if (map2d[index] == '.') {
    map2d[index] = '#'
  } else {
    map2d[index] = '.'
  }
  toggled.add(index);
}


window.onload = function() {
  document.querySelector('.fab#info').addEventListener('click', function() {
    Swal.fire({
      template: '#info-template'
    })
  })
}
