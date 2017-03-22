function setup() {
  createCanvas(640, 480);
  background(150,150,150)
}

function draw() {
  if (mouseIsPressed) {
    fill(0);
  } else {
    fill(255);
  }
  rect(mouseX-40, mouseY-40, 80, 80);
  stroke(100,0,0)

}
