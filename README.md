maze-js
=======

A recursive backtracking maze generator in JavaScript.

See it in action at https://cdn.rawgit.com/actsasbuffoon/maze-js/master/index.html

The code isn't gorgeous, but part of that is a result of optimizing it for speed. That said, there's still some work to be done to make it faster.

The controls on the page are:

* Blocks: The number of rows and columns in the maze.
* Canvas Size: The width and height of the canvas element (in pixels).
* Sleep: The amount of time to wait after each frame. Useful for watching the algorithm work. Lower is faster.
* Steps per frame: The number of blocks to fill in each frame. Higher is faster.
