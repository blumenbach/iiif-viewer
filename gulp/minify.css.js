var gulp = require('gulp'),
 cleanCSS = require('gulp-clean-css'),
 concat = require('gulp-concat'),
 paths = require('./paths.js'),
 rename = require('gulp-rename');

gulp.task('minify', function() {
    return gulp.src(paths.style)
        .pipe(sass().on('error', sass.logError))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(concat(paths.bundleName + '.css'))
        .pipe(rename(paths.bundleName + '.min.css'))
        .pipe(gulp.dest(paths.bundleDir));
});
