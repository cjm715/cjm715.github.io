let sketch = function(p) {
    let board;
    let next;
    let w = 20;
    let rows = 20;
    let columns = 35;

    p.setup = function() {
      p.frameRate(15);

      console.log(w*rows)
      console.log(w*columns)
      p.createCanvas(w*columns, w*rows);

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
      c1 = p.color('#F4A950'); // alive
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



//     let box1_x = 20
//     let box1_y = 20
//     let box1_width = 300
//     let box1_height = 300
//     let pad = 50
//
//     let box2_x = box1_width + pad
//     let box2_y = 20
//     let box2_width = 300
//     let box2_height = 300
//
//     let L = 5;
//     let N = 20;
//     let M = 20;
//
//     var learning_rate = 0.1
//
//     var w0;
//     var w1;
//
//     var data_x;
//     var data_y;
//
//     var w0_list = [];
//     var w1_list = [];
//
//     p.setup = function() {
//         // var canvasDiv = p.select('#canvasDiv')
//         canvas = p.createCanvas(box1_width + pad + box2_width + pad, box1_height + pad);
//         // canvas.parent(canvasDiv);
//         canvas.style('display', 'block');
//         p.initialize()
//         //
//         p.button = p.createButton('Restart');
//         // button.parent(canvasDiv);
//         p.button.mousePressed(p.initialize);
//     };
//
//     p.draw = function() {
//         p.background(200);
//         p.stroke(0);
//         p.fill(255);
//         p.rect(box1_x, box1_y, box1_width - 1, box1_height - 1);
//         p.stroke(0);
//         p.fill(0);
//         p.text('y', 5, box1_y + box1_height / 2);
//         p.text('x', box1_x + box1_width / 2, box1_y + box1_height + 10);
//         p.fill(0);
//
//         for (i = 0; i < N; i++) {
//             p.stroke(0);
//             let x_c = p.map(data_x[i], 0, 1, box1_x, box1_x + box1_width)
//             let y_c = p.map(data_y[i], 0, 1, box1_y + box1_height, box1_y)
//             p.circle(x_c, y_c, 2)
//         }
//
//
//         var batch_x = [];
//         var batch_y = [];
//         var j;
//
//
//         // Gradient descent
//         for (i = 0; i < M; i++) {
//             batch_x.push(data_x[i])
//             batch_y.push(data_y[i])
//         }
//
//         // *Stochastic* Gradient descent
//         // for (i = 0; i < M; i++) {
//         //     j = parseInt(p.random(0, N))
//         //     batch_x.push(data_x[j])
//         //     batch_y.push(data_y[j])
//         // }
//
//         var error_list = [];
//         for (i = 0; i < M; i++) {
//             error_list.push(p.linear_model(batch_x[i], w0, w1) - batch_y[i])
//         }
//
//         var dot_prod = 0.
//         for (i = 0; i < M; i++) {
//             dot_prod = dot_prod + error_list[i] * batch_x[i]
//         }
//         //console.log(dot_prod)
//
//         grad_w0 = 1. / M * error_list.reduce(add);
//         grad_w1 = 1. / M * dot_prod
//
//         w0 = w0 - learning_rate * grad_w0
//         w1 = w1 - learning_rate * grad_w1
//
//         p.plot_line(w0, w1)
//         p.plot_contour(w0, w1)
//         // console.log(error)
//         // console.log(dotprod)
//         // console.log(grad_w1)
//
//     };
//
//     p.initialize = function() {
//         w0_list = [];
//         w1_list = [];
//
//         w0 = p.random(-L, L)
//         w1 = p.random(-L, L)
//
//         data_x = []
//         data_y = []
//         for (i = 0; i < N; i++) {
//             data_x.push(i / N)
//             data_y.push(0.4 / N * i + 0.3 + p.random(-0.2, 0.2))
//         }
//     }
//
//     p.loss_func = function(w0, w1) {
//         var error = []
//         for (i = 0; i < data_x.length; i++) {
//             error.push((p.linear_model(data_x[i], w0, w1) - data_y[i]) ** 2.)
//         }
//         result = 1. / (2 * data_x.length) * error.reduce(add);
//         return result
//     }
//
//     function add(accumulator, a) {
//         return accumulator + a;
//     }
//
//
//     p.plot_contour = function(w0, w1) {
//         for (var x = 0; x < box2_width; x = x + 10) {
//             for (var y = 0; y < box2_height; y = y + 10) {
//                 var w0_g = p.map(x, 0, box2_width, -L, L);
//                 var w1_g = p.map(y, 0, box2_height, L, -L);
//                 z = p.loss_func(w0_g, w1_g)
//                 color_value = p.map(z, 0, 2, 255, 0)
//                 //console.log(z)
//                 p.stroke(color_value)
//                 p.fill(color_value);
//                 p.rect(box2_x + x, box2_y + y, 10, 10)
//             }
//         }
//
//         var w0_c = p.map(w0, -L, L, box1_width + pad, box1_width + pad + box2_width);
//         var w1_c = p.map(w1, L, -L, 0, box1_height);
//
//         if (w0_list.length < 1000) {
//             w0_list.push(w0_c)
//             w1_list.push(w1_c)
//         }
//
//         p.strokeWeight(0);
//         p.fill(255, 0, 0)
//         for (var i = 0; i < w0_list.length; i++) {
//             p.circle(w0_list[i], w1_list[i], 2)
//         }
//
//         p.strokeWeight(1);
//         p.fill(0, 255, 0)
//         p.circle(w0_c, w1_c, 5)
//
//         p.stroke(0)
//         p.noFill()
//         p.rect(box2_x, box2_y, box2_width - 1, box2_height - 1)
//         p.fill(0);
//         p.text('w0', box2_x + box2_width / 2, box2_y + box2_height + 10);
//         p.text('w1', box2_x - 15, box2_y + box2_height / 2);
//     };
//
//     p.get_feat = function(x) {
//         return [1, x]
//     }
//
//     p.linear_model = function(x, w0, w1) {
//         return w0 + w1 * x
//     }
//
//     p.pt2screen = function(x, y) {
//         var x_c = p.map(x, 0, 1, box1_x, box1_x + box1_width);
//         var y_c = p.map(y, 0, 1, box1_y + box1_height, box1_y);
//         return [x_c, y_c];
//     };
//
//     p.plot_line = function(w0, w1) {
//
//         let x_1 = 0
//         let y_1 = p.linear_model(x_1, w0, w1)
//         spt_1 = p.pt2screen(x_1, y_1)
//
//         let x_2 = 1
//         let y_2 = p.linear_model(x_2, w0, w1)
//
//         spt_2 = p.pt2screen(x_2, y_2)
//
//         p.line(spt_1[0], spt_1[1], spt_2[0], spt_2[1])
//     }
//
//
// };
//
//
// let sketch_sgd = function(p) {
//     let box1_x = 20
//     let box1_y = 20
//     let box1_width = 300
//     let box1_height = 300
//     let pad = 50
//
//     let box2_x = box1_width + pad
//     let box2_y = 20
//     let box2_width = 300
//     let box2_height = 300
//
//     let L = 2;
//     let N = 20;
//     let M = 1;
//
//     var learning_rate = 0.3
//
//     var w0;
//     var w1;
//
//     var data_x;
//     var data_y;
//
//     var w0_list = [];
//     var w1_list = [];
//
//     p.setup = function() {
//         // var canvasDiv = p.select('#canvasDiv-SGD')
//         canvas = p.createCanvas(box1_width + pad + box2_width + pad, box1_height + pad);
//         // canvas.parent(canvasDiv);
//         canvas.style('display', 'block');
//         p.initialize()
//         //
//         p.button = p.createButton('Restart');
//         p.button.mousePressed(p.initialize);
//     };
//
//     p.draw = function() {
//         p.background(200);
//         p.stroke(0);
//         p.fill(255);
//         p.rect(box1_x, box1_y, box1_width - 1, box1_height - 1);
//         p.stroke(0);
//         p.fill(0);
//         p.text('y', 5, box1_y + box1_height / 2);
//         p.text('x', box1_x + box1_width / 2, box1_y + box1_height + 10);
//         p.fill(0);
//
//         for (i = 0; i < N; i++) {
//             p.stroke(0);
//             let x_c = p.map(data_x[i], 0, 1, box1_x, box1_x + box1_width)
//             let y_c = p.map(data_y[i], 0, 1, box1_y + box1_height, box1_y)
//             p.circle(x_c, y_c, 2)
//         }
//
//
//         var batch_x = [];
//         var batch_y = [];
//         var j;
//
//
//         // Gradient descent
//         // for (i = 0; i < M; i++) {
//         //     batch_x.push(data_x[i])
//         //     batch_y.push(data_y[i])
//         // }
//
//         // *Stochastic* Gradient descent
//         for (i = 0; i < M; i++) {
//             j = parseInt(p.random(0, N))
//             batch_x.push(data_x[j])
//             batch_y.push(data_y[j])
//         }
//
//         var error_list = [];
//         for (i = 0; i < M; i++) {
//             error_list.push(p.linear_model(batch_x[i], w0, w1) - batch_y[i])
//         }
//
//         var dot_prod = 0.
//         for (i = 0; i < M; i++) {
//             dot_prod = dot_prod + error_list[i] * batch_x[i]
//         }
//         //console.log(dot_prod)
//
//         grad_w0 = 1. / M * error_list.reduce(add);
//         grad_w1 = 1. / M * dot_prod
//
//         w0 = w0 - learning_rate * grad_w0
//         w1 = w1 - learning_rate * grad_w1
//
//         p.plot_line(w0, w1)
//         p.plot_contour(w0, w1)
//         // console.log(error)
//         // console.log(dotprod)
//         // console.log(grad_w1)
//
//     };
//
//     p.initialize = function() {
//         w0_list = [];
//         w1_list = [];
//
//         w0 = p.random(-L, L)
//         w1 = p.random(-L, L)
//
//         data_x = []
//         data_y = []
//         for (i = 0; i < N; i++) {
//             data_x.push(i / N)
//             data_y.push(0.4 / N * i + 0.3 + p.random(-0.2, 0.2))
//         }
//     }
//
//     p.loss_func = function(w0, w1) {
//         var error = []
//         for (i = 0; i < data_x.length; i++) {
//             error.push((p.linear_model(data_x[i], w0, w1) - data_y[i]) ** 2.)
//         }
//         result = 1. / (2 * data_x.length) * error.reduce(add);
//         return result
//     }
//
//     function add(accumulator, a) {
//         return accumulator + a;
//     }
//
//
//     p.plot_contour = function(w0, w1) {
//         for (var x = 0; x < box2_width; x = x + 10) {
//             for (var y = 0; y < box2_height; y = y + 10) {
//                 var w0_g = p.map(x, 0, box2_width, -L, L);
//                 var w1_g = p.map(y, 0, box2_height, L, -L);
//                 z = p.loss_func(w0_g, w1_g)
//                 color_value = p.map(z, 0, 0.5, 255, 0)
//                 //console.log(z)
//                 p.stroke(color_value)
//                 p.fill(color_value);
//                 p.rect(box2_x + x, box2_y + y, 10, 10)
//             }
//         }
//
//         var w0_c = p.map(w0, -L, L, box1_width + pad, box1_width + pad + box2_width);
//         var w1_c = p.map(w1, L, -L, 0, box1_height);
//
//         if (w0_list.length < 1000) {
//             w0_list.push(w0_c)
//             w1_list.push(w1_c)
//         }
//
//         p.strokeWeight(0);
//         p.fill(255, 0, 0)
//         for (var i = 0; i < w0_list.length; i++) {
//             p.circle(w0_list[i], w1_list[i], 2)
//         }
//
//         p.strokeWeight(1);
//         p.fill(0, 255, 0)
//         p.circle(w0_c, w1_c, 5)
//
//         p.stroke(0)
//         p.noFill()
//         p.rect(box2_x, box2_y, box2_width - 1, box2_height - 1)
//         p.fill(0);
//         p.text('w0', box2_x + box2_width / 2, box2_y + box2_height + 10);
//         p.text('w1', box2_x - 15, box2_y + box2_height / 2);
//     };
//
//     p.get_feat = function(x) {
//         return [1, x]
//     }
//
//     p.linear_model = function(x, w0, w1) {
//         return w0 + w1 * x
//     }
//
//     p.pt2screen = function(x, y) {
//         var x_c = p.map(x, 0, 1, box1_x, box1_x + box1_width);
//         var y_c = p.map(y, 0, 1, box1_y + box1_height, box1_y);
//         return [x_c, y_c];
//     };
//
//     p.plot_line = function(w0, w1) {
//
//         let x_1 = 0
//         let y_1 = p.linear_model(x_1, w0, w1)
//         spt_1 = p.pt2screen(x_1, y_1)
//
//         let x_2 = 1
//         let y_2 = p.linear_model(x_2, w0, w1)
//
//         spt_2 = p.pt2screen(x_2, y_2)
//
//         p.line(spt_1[0], spt_1[1], spt_2[0], spt_2[1])
//     }


};

let myp5 = new p5(sketch, 'canvasDiv');
