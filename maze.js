var Block = function(maze, x, y) {
  this.x = x;
  this.y = y;
  this.coords = {x: this.x, y: this.y};
  this.width = maze.blockWidth;
  this.height = maze.blockHeight;
  this.maze = maze;
  this.markerSize = [this.width, this.height].sort(function(a,b) {return a-b;})[0];
  this.occupied = false;
  this.ctx = maze.ctx;
  this.parent = undefined;
  this.children = [];
};

Block.prototype.hasChild = function(other) {
  return this.children.lastIndexOf(other) > -1;
};

Block.prototype.randomAvailableNeighbor = function() {
  var neighbors = this.availableNeighbors();
  return neighbors[Math.floor(Math.random() * neighbors.length)];
};

Block.prototype.neighbors = function() {
  if (this._neighbors) {
    return this._neighbors;
  }

  this._neighbors = [];
  if (this.x > 0) {
    this._neighbors.push(this.neighbor(-1, 0));
  }

  if (this.x < this.maze.hBlocks - 1) {
    this._neighbors.push(this.neighbor(1, 0));
  }

  if (this.y > 0) {
    this._neighbors.push(this.neighbor(0, -1));
  }

  if (this.y < this.maze.vBlocks - 1) {
    this._neighbors.push(this.neighbor(0, 1));
  }

  return this._neighbors;
};

Block.prototype.availableNeighbors = function() {
  var neighbors = this.neighbors();
  return neighbors.filter(function(n) {return !n.occupied;});
};

Block.prototype.neighbor = function(relX, relY) {
  x = this.x + relX;
  y = this.y + relY;
  if (x >= 0 && x < this.maze.hBlocks && y >= 0 && y < this.maze.vBlocks) {
    return this.maze.blocks[y][x];
  }
};

Block.prototype.connectTo = function(other) {
  this.children.push(other);
  other.parent = this;
};

Block.prototype.connectedTo = function(other) {
  if (other) {
    return this.parent === other || this.hasChild(other);
  } else {
    return false;
  }
};

Block.prototype.draw = function() {
  this.erase();

  if (!this.connectedTo(this.neighbor(0, -1))) {
    this.drawTopWall();
  }

  if (!this.connectedTo(this.neighbor(0, 1))) {
    this.drawBottomWall();
  }

  if (this.occupied && !this.connectedTo(this.neighbor(-1, 0))) {
    this.drawLeftWall();
  }

  if (!this.connectedTo(this.neighbor(1, 0))) {
    this.drawRightWall();
  }

  if (this.maze.blockInHistory(this)) {
    this.drawMarker();
  }
};

Block.prototype.erase = function() {
  this.ctx.fillStyle = "#FFFFFF";
  this.ctx.fillRect(this.x * this.width, this.y * this.height, this.width, this.height);
};

Block.prototype.drawTopWall = function() {
  this.ctx.strokeStyle = "#000000";
  this.ctx.beginPath();
  this.ctx.moveTo(this.x * this.width, this.y * this.height);
  this.ctx.lineTo((this.x + 1) * this.width, this.y * this.height);
  this.ctx.closePath();
  this.ctx.stroke();
};

Block.prototype.drawBottomWall = function() {
  this.ctx.strokeStyle = "#000000";
  this.ctx.beginPath();
  this.ctx.moveTo(this.x * this.width, (this.y + 1) * this.height);
  this.ctx.lineTo((this.x + 1) * this.width, (this.y + 1) * this.height);
  this.ctx.closePath();
  this.ctx.stroke();
};

Block.prototype.drawLeftWall = function() {
  this.ctx.strokeStyle = "#000000";
  this.ctx.beginPath();
  this.ctx.moveTo(this.x * this.width, this.y * this.height);
  this.ctx.lineTo(this.x * this.width, (this.y + 1) * this.height);
  this.ctx.closePath();
  this.ctx.stroke();
};

Block.prototype.drawRightWall = function() {
  this.ctx.strokeStyle = "#000000";
  this.ctx.beginPath();
  this.ctx.moveTo((this.x + 1) * this.width, this.y * this.height);
  this.ctx.lineTo((this.x + 1) * this.width, (this.y + 1) * this.height);
  this.ctx.closePath();
  this.ctx.stroke();
};

Block.prototype.drawMarker = function() {
  this.ctx.fillStyle = this.maze.currentBlock === this ? "#FF9999" : "#9999FF";

  this.ctx.beginPath();
  this.ctx.arc(this.x * this.width + this.width / 2,
               this.y * this.height + this.height / 2,
               this.markerSize * 0.33,
               0,
               Math.PI * 2, false);
  this.ctx.fill();
};

var MazeGenerator = function(width, height, hBlocks, vBlocks, id) {
  this.canvas = document.getElementById(id);
  this.canvas.width = width;
  this.canvas.height = height;
  this.ctx = this.canvas.getContext('2d');
  this.ctx.fillStyle = "#CCCCCC";
  this.ctx.fillRect(0, 0, width, height);
  this.width = width;
  this.height = height;
  this.hBlocks = hBlocks;
  this.vBlocks = vBlocks;
  this.blockWidth = this.width / this.hBlocks;
  this.blockHeight = this.height / this.vBlocks;
  this.finished = false;
  this.blocks = [];
  this.history = [];
  this.currentBlock = undefined;
  this.initBlocks();
};

MazeGenerator.prototype.initBlocks = function() {
  for (var y = 0; y < this.vBlocks; ++y) {
    var row = [];
    for (var x = 0; x < this.hBlocks; ++x) {
      row.push(new Block(this, x, y));
    }
    this.blocks.push(row);
  }
};

MazeGenerator.prototype.blockInHistory = function(block) {
  return this.history.lastIndexOf(block) > -1;
};

MazeGenerator.prototype.drawLoop = function() {
  for (var c = 0; c < 1500; ++c) {
    if (!this.finished) {
      this.step();
      this.checkFinished();
    }
  }

  var _this = this;
  setTimeout(function() {
    _this.drawLoop();
  }, 0);
};

MazeGenerator.prototype.step = function() {
  var oldBlock = this.currentBlock;
  this.currentBlock = this.chooseBlock();

  if (!this.currentBlock) {
    oldBlock.draw();
    this.finished = true;
    return;
  }

  this.currentBlock.occupied = true;
  if (!this.blockInHistory(this.currentBlock)) {
    this.history.push(this.currentBlock);
  }

  if (oldBlock) {
    if (!oldBlock.hasChild(this.currentBlock) && this.currentBlock.parent === undefined) {
      oldBlock.connectTo(this.currentBlock);
    }
    oldBlock.draw();
  }

  this.currentBlock.draw();
};

MazeGenerator.prototype.chooseBlock = function() {
  if (this.currentBlock) {
    var n = this.currentBlock.randomAvailableNeighbor();
    if (n) {
      return n;
    } else {
      this.history.pop();
      return this.history.pop();
    }
  } else {
    var x = Math.floor(Math.random() * this.hBlocks);
    var y = Math.floor(Math.random() * this.vBlocks);
    return this.blocks[y][x];
  }
}

MazeGenerator.prototype.checkFinished = function() {
  return false;
}

function initMaze() {
  window.maze = new MazeGenerator(3600, 2400, 300, 200, 'maze');
  window.maze.drawLoop();
}
