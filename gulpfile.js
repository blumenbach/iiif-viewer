require('require-dir')('./gulp');

var gulp = require('gulp');
gulp.task('default', ['browserify', 'makeCss']);
gulp.task('serve', ['makeCss', 'browserifyForDebug', 'watch', 'connect']);
