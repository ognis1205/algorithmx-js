# Javascript Generalized Algorithm X Implementation

With this generic Knuth's Algorithm X implementation, all possible
constraint problems can be solved by implementing complementaary
snipetts.

## Usage

Consider a exact cover problem, s.t., given a tiles, you must cover a floor
without any margin. And now you will try this problem with this module.

First, you must "require" modules:

    var Matrix = require('./matrix');
    var Constraint = Matrix.Constraint;
    var Configuration = Matrix.Configuration;

and define block and floor, i.e., problem classes:

    var Block = function _Class_Of_Block_(width, height, _id) {
        // Possibly global unique ID.
        this.id = _id != null ? _id : guid++;
        // Holds block width.
        this.width = width;
        // Holds block height.
        this.height = height;
        // Holds x coordinate.
        this.x = 0;
        // Holds y coordinate.
        this.y = 0;
    };

    var Problem = function _Class_Of_Problem_(width, height, blocks) {
        // Holds board width.
        this.width = width;
        // Holds board height.
        this.height = height;
        // Holds blocks to be configured.
        this.blocks = blocks;
        // Holds Algorithm X matrix.
        this.matrix = new Matrix();
        // Holds constraints.
        this.constraints = [];
        // Initialization.
        this.setup();
    };

Second, you must bind each block configurations with corresponding satisfiable
constraints:

    // Initializes the problem.
    Problem.prototype.setup = function setup() {
        // Prepares constraints.
        for (var i = 0; i < this.width * this.height; i++) {
            this.constraints[i] = new Constraint('Cell ' + i + ' must be fullfilled.');
        }
        // Prepares configurations.
        for (var i = 0; i < this.blocks.length; i++) {
            var block = this.blocks[i];
            for (var j = 0; j < this.width * this.height; j++) {
                var x = j % this.width;
                var y = Math.floor(j / this.width);
                if (this.contains(x, y, block)) {
                    block = this.blocks[i].clone();
                    block.x = x;
                    block.y = y;
                    var configuration = new Configuration(block);
                    var _constraints = [];
                    for (var k = 0; k < block.width * block.height; k++) {
                        var dx = k % block.width;
                        var dy = Math.floor(k / block.width);
                        _constraints.push(this.constraints[j + (dy * this.width) + dx]);
                    }
                    this.matrix.push(configuration, _constraints);
                }
            }
        }
    };

Now you can be there, after implementing relating functions, such as problem parser,
you can solve this proble:

    // Main routine.
    var main = function() {
        var args = process.argv.slice(2);
        if (args.length > 1) {
            try {
                var blocks = [];
                for (var i = 1; i < args.length; i++) {
                    blocks.push(Block.parse(args[i]));
                }
                var problem = Problem.parse(args[0], blocks);
                var founds = [];
                var auxiliary = [];
                founds = Matrix.solve(problem.matrix, founds, auxiliary, 1);
                    console.log(founds);
                });
            } catch (error) {
                console.log(error);
            }
        } else {
            console.log('erroe: invalid block number');
        }
    };

Voila! Easy to go.