let sketch = function(p) {
    let board;
    let next;
    let w = 20;
    let rows;
    let columns;
    let width;
    let height;

    p.setup = function() {
      p.frameRate(8);

      window_width = p.floor(0.9*document.body.clientWidth / w) * w

      width = p.min(740, window_width)
      height = 400

      columns = p.floor(width / w)
      rows = p.floor(height / w);

      let cnv = p.createCanvas(width, height);
      //cnv.position(document.body.clientWidth/2 + width/2)
      //cnv.position(document.body.clientWidth/2 - width/2);

      // Wacky way to make a 2D array in JS
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
    }

    p.draw = function() {
      c1 = p.color('#3e9bf4');
      c2 = p.color('#161B21'); // dead
      c3 = p.color('#000000'); // border


      p.background(c2);
      p.generate();
      for ( let i = 0; i < columns;i++) {
        for ( let j = 0; j < rows;j++) {
          if ((board[i][j] == 1)) p.fill(c1);
          else p.fill(c2);
          p.stroke(c3);
          p.rect(i * w, j * w, w-1, w-1);
          // console.log(j)
        }
      }


    }

    // reset board when mouse is pressed
    p.mousePressed = function() {
        if (((p.mouseX >= 0) & (p.mouseX <= width)) &
            ((p.mouseY >= 0) & (p.mouseY <= height))){
            p.init();
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


let myp5 = new p5(sketch, 'canvasDiv');
