var fs = require('fs');
var path = require('path');

function cTrue (any) { return true; }

function matchRegex (rx) {
    return function (filename) {
        return rx.test(filename);
    }
}

function matcher (filter) {
    if (!filter) {
        return cTrue;
    }
    if (typeof filter === 'string') {
        return matchRegex(new RegExp(filter));
    }
    if (typeof filter === 'function') {
        return filter;
    }
    if (typeof filter.test === 'function') {
        return matchRegex(filter);
    }
    return cTrue;
}

function find (dir, filter) {
    return function (next, error, complete) {
        var results = [];
        var completed = false;
        function onComplete() {
            if(!completed) {
                completed = true;
                if(complete) { complete(); }
            }
        }
        walk(dir, filter)(
            function (n) { results.push(n); },
            function (err) { error(err); onComplete(); },
            function () { onComplete(); }
        );
    };
   
}

function walk (dir, filter) {
    var match = matcher(filter);
    return function (next, error, complete) {
        var completed = false;
        function onComplete() {
            if(!completed) {
                completed = true;
                if(complete) { complete(); }
            }
        }
        fs.readdir(dir, function (err, list) {
            if (completed) {
                return;
            }
            if (err) {
                error(err);
                onComplete();
                return;
            }
            var pending = list.length;
            if (!pending) {
                onComplete();
                return;
            }
            list.forEach(function (file) {
                var filePath = path.resolve(dir, file);
                fs.stat(filePath, function (errFile, stat) {
                    if (stat && stat.isDirectory()) {
                        //recursive step
                        walk(filePath, match)(
                            next,
                            error,
                            function () {
                                pending--;
                                if (pending === 0) {
                                    onComplete();
                                }
                            }
                        ); 
                    } else {
                        if (match(file)) {
                            pending--;
                            next (file);
                        }
                    }
                    if (pending === 0) {
                        onComplete();
                    }
                });
            });
        });
    };
}

module.exports = {
    walk: walk,
    find: find
};