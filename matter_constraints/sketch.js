// module aliases
var Engine = Matter.Engine,
  // Render = Matter.Render,
  World = Matter.World,
  Bodies = Matter.Bodies;
  Constraint = Matter.Constraint;
  Mouse = Matter.Mouse;
  MouseConstraint = Matter.MouseConstraint;

// create an engine
var engine;
var world;
var particles=[];
var ground;
var boundaries =[];

function setup() {
  var canvas = createCanvas(400,400);
  engine = Engine.create();
  world = engine.world;
  Engine.run(engine);

  var prev = null;
  for (var x=200 ; x < 380; x+=10) {

    var fixed = false;

    if (!prev){
      fixed = true
    }

    var p = new Circle(x, 100,5,fixed);
    particles.push(p);

    if (prev){
      var options= {
        bodyA: p.body,
        bodyB: prev.body,
        length: 10,
        stiffness:0.9
      }
      var constraint = Constraint.create(options)
      World.add(world, constraint)
    }
    prev = p;
    }

    boundaries.push(new Boundary(200, height, width, 10, 0))

    var canvasmouse = Mouse.create(canvas.elt);
    canvasmouse.pixelRatio = pixelDensity();
    var options =  {
      mouse: canvasmouse
    }

    mConstraint = MouseConstraint.create(engine, options)
    World.add(world,mConstraint);

}

// function mouseDragged(){
//   particles.push(new Circle(mouseX,mouseY,random(1,10)))
// }

function draw() {
  background(100);
  for (var i=0; i < particles.length; i++){
    particles[i].show();
  }
  for (var i=0; i < boundaries.length; i++){
    boundaries[i].show()
  }

  //line(particles[0].body.position.x,particles[0].body.position.y,particles[1].body.position.x,particles[1].body.position.y)
}
