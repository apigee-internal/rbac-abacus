'use strict';

var fs = require('fs');
var path = require('path');
var walker = require('./fsWalker');

var confPath = path.resolve('./', 'tslint.json');
var srcPath = path.resolve('./', 'src');

console.log('path', confPath);

fs.readFile(confPath, 'utf8', function (err, data) {
    if (err) throw err;
    // console.log(data);
    var options = {
        formatter: "json",
        configuration: JSON.parse(data)
    };

    var Linter = require("tslint");

    walker.walk(srcPath)(
        function (next) {
            var content = fs.readFileSync(path.resolve(srcPath, next), 'utf8');
            var ll = new Linter(next, content, options);
            var result = ll.lint();
            if (result.failureCount > 0) {
                console.log(result);
            }
        }
    );
});