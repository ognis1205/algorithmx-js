/**
 * @fileoverview Algorithm X Module.
 */
(function() {
    "use strict";

    /**
     * Represents circular list container.
     */
    var CircularListContainer = function _Class_Of_Circular_List_Container_(data, handler) {
        // Specifies whether corresponding node is eliminated or not.
        this.eliminated = false;
        // Holds corresponding data.
        this.data = data ? data : {};
        // Holds callback function which is hooked on pre-defined events.
        this.handler = handler ? handler : {};
        // Holds previous container.
        this.previous = this;
        // Holds next container.
        this.next = this;
        // If this value is set to be true, which means the currently refering point is matrix header.
        this.isHeader = false;
    };

    // Visits all elements and apply the specified function.
    CircularListContainer.prototype.forEach = function forEach(func) {
        if (typeof func == 'function' && !this.eliminated) {
            var next = this;
            do {
                var current = next;
                var next = current.next;
                var result = (!current.isHeader) ? func(current.data, current) : true;
                if (result === false) {
                    break;
                }
            } while (next != this);
        }
        return this;
    };

    // Adds circular list to this list.
    CircularListContainer.prototype.splice = function splice(list) {
        var old = this.previous;
        this.previous.next = list.next;
        this.previous = list;
        list.next.previous = old;
        list.next = this;
        if (this.handler && typeof this.handler.handleOnSpliced == 'function') {
            this.handler.handleOnSpliced(this);
        }
        return this;
    };

    // Pushes new data into the list with assignment of handler.
    CircularListContainer.prototype.push = function push(data, handler) {
        if (data) {
            var node = new CircularListContainer(data, handler);
            node.splice(this.previous);
        }
        return this;
    };

    // Eliminates current node from the list.
    CircularListContainer.prototype.eliminate = function eliminate() {
        if (!this.eliminated) {
            this.eliminated = true;
            this.next.previous = this.previous;
            this.previous.next = this.next;
            if (this.handler && typeof this.handler.handleOnEliminated == 'function') {
                this.handler.handleOnEliminated(this);
            }
        }
        return this;
    };

    // Retaines eliminated node from the list.
    CircularListContainer.prototype.retain = function retain() {
        if (this.eliminated) {
            this.eliminated = false;
            this.next.previous = this;
            this.previous.next = this;
            if (this.handler && typeof this.handler.handleOnRetained == 'function') {
                this.handler.handleOnRetained(this);
            }
        }
        return this;
    };


    /**
     * Represents quadly linked list.
     */
    var QuadLinkedNode = function _Class_Of_Quad_Linked_Node_(rowHeader, columnHeader) {
        // Holds row list header, MUST BE DEFINED AND NOT NULLABLE.
        this.rowHeader = rowHeader;
        // Holds column list header, MUST BE DEFINED AND NOT NULLABLE
        this.columnHeader = columnHeader;
        // Holds this instance for closure implementation.
        var self = this;
        // Holds event handler.
        var handler = {
            'handleOnSpliced' : function(node) {
                this.handleOnRetained(node);
            },
            'handleOnRetained' : function(node) {
                if (node == self.row && self.rowHeader) {
                    self.rowHeader.cardinality++;
                } else if (node == self.column && self.columnHeader) {
                    self.columnHeader.cardinality++;
                }
            },
            'handleOnEliminated' : function(node) {
                if (node == self.row && self.rowHeader) {
                    self.rowHeader.cardinality--;
                } else if (node == self.column && self.columnHeader) {
                    self.columnHeader.cardinality--;
                }
            }
        };
        // Holds row list.
        this.row = new CircularListContainer(this, handler);
        // Holds column list.
        this.column = new CircularListContainer(this, handler);
    };

    // Adds circular list to this list.
    QuadLinkedNode.prototype.splice = function splice() {
        if (this.rowHeader) {
            this.row.splice(this.rowHeader.row.previous);
        }
        if (this.columnHeader) {
            this.column.splice(this.columnHeader.column.previous);
        }
        return this;
    };

    // Visits all elements and apply the specified function.
    QuadLinkedNode.prototype.forEach = function forEach(direction, func) {
        var list = this[direction];
        if (list && typeof list.forEach == 'function') {
            list.forEach(func);
        }
        return this;
    };

    // Eliminates current node from the list.
    QuadLinkedNode.prototype.eliminateFrom = function eliminateFrom(from, _trace) {
        var list = this[from];
        if (_trace) {
            _trace.push(list);
        }
        list.eliminate();
        return this;
    };


    /**
     * Represents constraints.
     */
    var Constraint = function _Class_Of_Constraint_(_placeholder) {
        // Inherits from QuadLinkedNode.
        QuadLinkedNode.call(this);
        // Holds constraints GUID.
        this.id = Constraint.GUID++;
        // Holds placeholder.
        this.placeholder = _placeholder ? _placeholder : {};
        // Holds cardinality of constraint instances.
        this.cardinality = 0;
        // If this value is set to be true, which means the currently refering point is matrix header.
        this.column.isHeader = true;
    };

    // Constraints GUID.
    Constraint.GUID = 0;

    // Ad-hoc inheritance.
    Constraint.prototype = Object.create(QuadLinkedNode.prototype);

    // Satisfies the corresponding constraint condition.
    Constraint.prototype.satisfied = function(_trace) {
        this.eliminateFrom('row', _trace);
        this.forEach('column', function(node) {
            var configuration = node.rowHeader;
            configuration.excluded(_trace);
        });
        if (this.handler && typeof this.handler.handleOnSatisfied == 'function') {
            this.hander.handleOnSatisfied(this, _trace);
        }
    };


    /**
     * Represents configurations.
     */
    var Configuration = function _Class_Of_Configuration_(_placeholder) {
        // Inherits from QuadLinkedNode.
        QuadLinkedNode.call(this);
        // Holds placeholder.
        this.placeholder = _placeholder ? _placeholder : {};
        // Holds cardinality of constraint instances.
        this.cardinality = 0;
        // If this value is set to be true, which means the currently refering point is matrix header.
        this.row.isHeader = true;
    };

    // Ad-hoc inheritance.
    Configuration.prototype = Object.create(QuadLinkedNode.prototype);

    // Selects the corresponding configuration.
    Configuration.prototype.chosen = function chosen(_trace) {
        this.forEach('row', function(node) {
            var constraint = node.columnHeader;
            constraint.satisfied(_trace);
        });
        if (this.handler && typeof this.handler.handleOnChosen == 'function') {
            this.handler.handleOnChosen(this, _trace);
        }
    };

    // Eliminates current node from the list.
    Configuration.prototype.excluded = function(_trace) {
        this.eliminateFrom('column', _trace);
        this.forEach('row', function(node) {
        //    var constraint = node.columnHeader;
            node.eliminateFrom('column', _trace);
        });
        if (this.handler && typeof this.handler.handleOnExcluded == 'function') {
            this.handler.handleOnExcluded(this, _trace);
        }
    };

    // Removes current node from the list.
    Configuration.prototype.removed = function(_trace) {
        this.eliminateFrom('column', _trace);
        this.forEach('row', function(node) {
            node.eliminateFrom('column', _trace);
        });
    };

    // Assigns that this configuration satisfies the given constraint.
    Configuration.prototype.satisfies = function(constraint) {
        var node = new QuadLinkedNode(this, constraint);
        return node.splice();
    };

    // Visits all elements and apply the specified function.
    Configuration.prototype.forEachConstraint = function forEachConstraint(func) {
        this.forEach('column', function(node) {
            var constraint = node.columnHeader;
            return func(constraint);
        });
    };


    /**
     * Represents matrices.
     */
    var Matrix = function _Class_Of_Matrix_() {
        // Inherits from QuadLinkedNode.
        QuadLinkedNode.call(this);
        // Specifies this is row header.
        this.row.isHeader = true;
        // Specifies this is colunm header.
        this.column.isHeader = true;
        // For lazy evaluation.
        this.constraints = {};
    };

    // Ad-hoc inheritance.
    Matrix.prototype = Object.create(QuadLinkedNode.prototype);

    // Pushes configuration and its constraints.
    Matrix.prototype.push = function push(configuration, _constraints) {
        configuration.column.splice(this.column.previous);
        for (var i = 0; i < _constraints.length; i++) {
            var constraint = this.constraints[_constraints[i].id];
            if (!constraint) {
                constraint = _constraints[i];
                this.constraints[_constraints[i].id] = constraint;
                constraint.row.splice(this.row.previous);
            }
            configuration.satisfies(constraint);
        }
        return this;
    };

    // Returns the constraint whose possible configuration is the least one.
    Matrix.prototype.pop = function pop() {
        var result = null;
        var cardinality = null;
        this.forEach('row', function(constraint) {
            if (!cardinality || cardinality > constraint.cardinality) {
                result = constraint;
                cardinality = result.cardinality;
                if (cardinality == 0) {
                    return true;
                }
            }
        });
        return result;
    };

    // Resumes all tracking nodes' configuration.
    function resume(trace) {
        for (var i = 0; i < trace.length; ++i) {
            trace[i].retain();
        }
    }

    // Lists all solutions.
    Matrix.solve = function solve(matrix, results, auxiliary, _upper) {
        var constraint = matrix.pop();
        if (constraint == null) {
            results.push(auxiliary);
            if (_upper && results.length >= _upper) {
                return results;
            }
        } else if (constraint.cardinality == 0) {
            // DO NOTHING, BACKTRACKING.
        } else {
            constraint.forEach('column', function(node) {
                var configuration = node.rowHeader;
                var cached = auxiliary.slice();
                if (configuration.placeholder != null) {
                    cached.push(configuration.placeholder);
                }
                var trace = [];
                configuration.chosen(trace);
                solve(matrix, results, cached, _upper);
                resume(trace);
            });
        }
        return results;
    }

    // Exports modules.
    try {
	window.Matrix               = Matrix;
	window.Matrix.Constraint    = Constraint;
	window.Matrix.Configuration = Configuration;
    } catch (e) {}

    try {
	module.exports               = Matrix;
	module.exports.Constraint    = Constraint;
	module.exports.Configuration = Configuration;
    } catch (e) {}
})();
