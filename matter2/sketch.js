// module aliases
var Engine = Matter.Engine,
  // Render = Matter.Render,
  World = Matter.World,
  Bodies = Matter.Bodies;

// create an engine
var engine;
var world;
var circles=[];
var ground;
var boundaries =[];

function setup() {
  createCanvas(400,400);
  engine = Engine.create();
  world = engine.world;
  Engine.run(engine);
  var options = {
    isStatic: true
  }
  boundaries.push(new Boundary(50, 100, width, 10, 0.3))
  boundaries.push(new Boundary(50, 300, width, 10, 0.3))
  boundaries.push(new Boundary(300, 200, width, 10, -0.3))
  boundaries.push(new Boundary(200, height, width, 10, 0))
  boundaries.push(new Boundary(0, height/2, 10, height, 0))
  boundaries.push(new Boundary(width, height/2, 10, height, 0))
}

function mouseDragged(){
  circles.push(new Circle(mouseX,mouseY,random(1,10)))
}

function draw() {
  background(100);
  for (var i=0; i < circles.length; i++){
    circles[i].show();
  }
  for (var i=0; i < boundaries.length; i++){
    boundaries[i].show()
  }

}
