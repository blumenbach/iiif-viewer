var gulp = require('gulp'),
	concat = require('gulp-concat'),
	paths = require('./paths.js'),
	connect = require('gulp-connect'),
	sourcemaps = require('gulp-sourcemaps');
	autoprefixer = require('gulp-autoprefixer'),
	sass = require('gulp-sass'),
	cssImport = require('gulp-cssimport'),
	rename = require('gulp-rename'),
	notify = require('gulp-notify'),
	minifyCSS = require('gulp-clean-css');


gulp.task('makeCss', function() {
	  return gulp.src(paths.style)
		.pipe(cssImport())
	    .pipe(sass())
	    .on("error", notify.onError(function(error) {
	    	return error.message;
	    }))
			.pipe(autoprefixer({
					browsers: ['> 5%']
			}))
	    .pipe(concat(paths.bundleName + '.css'))
	    .pipe(gulp.dest(paths.bundleDir))
	    .pipe(minifyCSS({
			advanced: false
		}))
	    .pipe(rename(paths.bundleName + '.min.css'))
	    .pipe(gulp.dest(paths.bundleDir))
	    .pipe(connect.reload());
});
