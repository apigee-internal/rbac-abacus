'use strict';

var Jasmine = require('jasmine');
var jasmine = new Jasmine();

var bizancio = require('./npm/bizancio');

bizancio.hookRequire();

process.once('exit', function () {
    bizancio.writeReports('m-coverage');
}); //write coverage reports 

jasmine.loadConfigFile('spec/support/jasmine.json');
jasmine.configureDefaultReporter({
    showColors: true
});

jasmine.onComplete(function(passed) {
    if(passed) {
        console.log('All specs have passed :)');
    }
    else {
        console.log('At least one spec has failed :(');
    }
});

jasmine.execute();