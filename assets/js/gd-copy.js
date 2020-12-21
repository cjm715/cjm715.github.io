let sketch = function(p) {
    let board;
    let next;
    let w = 20;
    let rows;
    let columns;

    p.setup = function() {
      p.frameRate(8);

      window_width = p.floor(0.9*document.body.clientWidth / w) * w

      width = p.min(740, window_width)
      height = 400

      columns = p.floor(width / w)
      rows = p.floor(height / w);

      p.createCanvas(width, height);

      // Wacky way to make a 2D array in JS
      board = new Array(columns);
      for (let i = 0; i < columns; i++) {
        board[i] = new Array(rows);
      }
      // console.log(board)

      // Going to use multiple 2D arrays and swap them
      next = new Array(columns);
      for (i = 0; i < columns; i++) {
        next[i] = new Array(rows);
      }
      p.init();
    }

    p.draw = function() {
        // console.log(columns)
        // console.log(rows)


      //c1 = p.color('#195190FF'); // dark
      //c2 = p.color('#A2A2A1FF'); // light

      // c1 = p.color('#EC4D37'); // alive
      // c2 = p.color('#1D1B1B'); // dead
      // c3 = p.color('#000000'); // border

      // c1 = p.color('#EC8B5E'); // alive
      // c2 = p.color('#141A46'); // dead
      // c3 = p.color('#000000'); // border
      //
      // c1 = p.color('#F4A950'); // alive
      // c2 = p.color('#161B21'); // dead
      // c3 = p.color('#000000'); // border

      //c1 = p.color('#1cc9e3'); // alive
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
      p.init();
    }

    // Fill board randomly
    p.init = function() {
      for (let i = 0; i < columns; i++) {
        for (let j = 0; j < rows; j++) {
          // Lining the edges with 0s
          if (i == 0 || j == 0 || i == columns-1 || j == rows-1) board[i][j] = 0;
          // Filling the rest randomly
          else board[i][j] = p.floor(p.random(2));
          next[i][j] = 0;
        }
      }
    }

    // The process of creating the new generation
    p.generate = function() {

      // Loop through every spot in our 2D array and check spots neighbors
      for (let x = 1; x < columns - 1; x++) {
        for (let y = 1; y < rows - 1; y++) {
          // Add up all the states in a 3x3 surrounding grid
          let neighbors = 0;
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              neighbors += board[x+i][y+j];
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
