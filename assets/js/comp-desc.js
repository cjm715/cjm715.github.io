let comp_desc = function(p){
    let board;
    let next;
    let w = 6;
    let pad = 15;
    let rows;
    let columns;
    let canvasWidth;
    let canvasHeight;
    let blueColor = p.color('#3e9bf4');
    let blackColor = p.color('#000000');
    p.setup = function() {
        p.frameRate(8);

        columns = 25;
        rows = 25;

        width = columns * w;
        height = rows * w;

        canvasWidth = width*4 + 5*pad;
        canvasHeight = 1.5*height;

        let cnv = p.createCanvas(canvasWidth, canvasHeight);
        //cnv.parent('canvasDiv2');
        //cnv.position(document.body.clientWidth/2 + width/2)
        //cnv.position(x=document.body.clientWidth/2 - width/2,      positionType='sticky');
        // cnv.position(50, 0, 'relative');

        // Wacky way to make a 2D aray in JS
        board = new Array(columns);
        for (let i = 0; i < columns; i++) {
            board[i] = new Array(rows);
        }

        // Going to use multiple 2D arrays and swap them
        next = new Array(columns);
        for (i = 0; i < columns; i++) {
            next[i] = new Array(rows);
        }
        p.init();
        //

        white_col = p.color('#FFFFFF')
        p.background(white_col);

        // generate 10 steps before first start state
        for (i = 0; i < 10; i++) {
          p.generate()
        }

        // t=0 state (start state)
        p.drawBoard(pad, pad)

        p.textSize(16);
        p.fill(blackColor);
        p.noStroke()
        p.text('t=0 (start)', width/2-pad, height + 2.1*pad);

        // t = 1 state
        p.generate();
        p.drawBoard(width+2*pad, pad)

        // t = 2 state
        p.generate();
        p.drawBoard(2*width + 3*pad, pad)

        // t =  3 state (stop state)
        p.generate();
        p.drawBoard(3*width + 4*pad, pad)
        p.textSize(16);
        p.fill(blackColor);
        p.noStroke()
        p.text('t=3 (stop)', 3.5*width +pad, height + 2.1*pad);

        // Time text
        p.textSize(16);
        //p.textAlign(p.CENTER);
        p.fill(blackColor);
        p.noStroke()
        p.text('time',2*width + pad,height + 3.5*pad,canvasWidth);

        // Arrow
        base = p.createVector(canvasWidth/2-4*pad, height+4*pad)
        vec = p.createVector(8*pad, 0)
        p.push();
        p.stroke(blackColor);
        p.strokeWeight(2);
        p.fill(blackColor);
        p.translate(base.x, base.y);
        p.line(0, 0, vec.x, vec.y);
        p.rotate(vec.heading());
        let arrowSize = 5;
        p.translate(vec.mag() - arrowSize, 0);
        p.triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
        p.pop();

    }


    p.draw = function() {
      // p.generate();
      // p.drawBoard(0, 100)
    }

    p.drawBoard = function(x_offset, y_offset){
        c1 = p.color('#3e9bf4');
        c2 = p.color('#161B21'); // dead
        c3 = p.color('#000000'); // border



        for ( let i = 0; i < columns;i++) {
          for ( let j = 0; j < rows;j++) {
            if ((board[i][j] == 1)) p.fill(c1);
            else p.fill(c2);
            p.stroke(c3);
            p.rect(x_offset + i * w, y_offset + j * w, w-1, w-1);
            // console.log(j)
          }
        }
    }

    // reset board when mouse is pressed
    p.mousePressed = function() {
      if (((p.mouseX >= 0) & (p.mouseX <= canvasWidth)) &
          ((p.mouseY >= 0) & (p.mouseY <= canvasHeight))){
          p.setup();
      }
    }

    p.windowResized = function() {
      p.setup();
    }

    // Fill board randomly
    p.init = function() {
        for (let i = 0; i < columns; i++) {
          for (let j = 0; j < rows; j++) {

            // Filling randomly
            board[i][j] = p.floor(p.random(2));

            next[i][j] = 0;
          }
        }
    }
    p.mod = function(x, n) {
        return ((x % n) + n) % n
    }

    // The process of creating the new generation
    p.generate = function() {

      // Loop through every spot in our 2D array and check spots neighbors
      for (let x = 0; x < columns; x++) {
        for (let y = 0; y < rows; y++) {
          // Add up all the states in a 3x3 surrounding grid
          let neighbors = 0;
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              col_id = p.mod((x+i), columns)
              row_id = p.mod((y+j), rows)

              // console.log(col_id)

              neighbors += board[col_id][row_id];
            }
          }

          // A little trick to subtract the current cell's state since
          // we added it in the above loop
          neighbors -= board[x][y];
          // Rules of Life
          if      ((board[x][y] == 1) && (neighbors <  2)) next[x][y] = 0;           // Loneliness
          else if ((board[x][y] == 1) && (neighbors >  3)) next[x][y] = 0;           // Overpopulation
          else if ((board[x][y] == 0) && (neighbors == 3)) next[x][y] = 1;           // Reproduction
          else                                             next[x][y] = board[x][y]; // Stasis
        }
      }

      // Swap!
      let temp = board;
      board = next;
      next = temp;
    }
};

let myp5_4 = new p5(comp_desc, 'compDescDiv');
