'use strict';

var istanbul = require('istanbul');
var path = require('path');
var Instrumenter = istanbul.Instrumenter;
var instrumenter = new Instrumenter();
var hook = istanbul.hook;
var Report = istanbul.Report;
var Collector = istanbul.Collector;

function isNotSpecFile (fileName) {
    return /\/m-coverage\/build\/.+\.js$/.test(fileName) && !/\.spec\.js$/.test(fileName);
}

function hookRequire (verbose) {

    var matchFn = function (file) {
        var match = isNotSpecFile(file),
            what = match ? 'Hooking: ' : 'NOT hooking: ';
        if (verbose) { console.log(what + file); }
        return match;
    };
    var transformFn = instrumenter.instrumentSync.bind(instrumenter);

    hook.hookRequire(matchFn, transformFn);
}

/**
 * returns the coverage collector, creating one and automatically
 * adding the contents of the global coverage object. You can use this method
 * in an exit handler to get the accumulated coverage.
 */
function getCollector() {
    var collector = new Collector();

    if (global['__coverage__']) {
        collector.add(global['__coverage__']);
    } else {
        console.error('No global coverage found for the node process');
    }
    return collector;
}

/**
 * writes reports for everything accumulated by the collector
 * @method writeReports
 * @param outputDir the output directory for reports
 */
function writeReports (outputDir) {
    writeReportsInternal(outputDir, getCollector());
}

function writeReportsInternal(dir, collector) {
    dir = dir || process.cwd();
    var reports = [
        // Report.create('lcov', { dir: dir }),
        Report.create('text'),
        Report.create('json', { dir: dir }),
        Report.create('text-summary')
    ];
    reports.forEach(function (report) { report.writeReport(collector, true); })
}

module.exports = {
    hookRequire: hookRequire,
    writeReports: writeReports
};