var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync').create();
var header = require('gulp-header');
var cleanCSS = require('gulp-clean-css');
var pug = require('gulp-pug');
var beautify = require('gulp-html-beautify');
var rename = require("gulp-rename");
var uglify = require('gulp-uglify');
var pkg = require('./package.json');
var concat = require('gulp-concat');

// Set the banner content
var banner = ['/*!\n',
  ' * Start Bootstrap - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
  ' * Copyright 2013-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
  ' * Licensed under <%= pkg.license %> (https://github.com/BlackrockDigital/<%= pkg.name %>/blob/master/LICENSE)\n',
  ' */\n',
  ''
].join('');

// Compiles SCSS files from /scss into /css
gulp.task('sass', function() {
  return gulp.src('app/scss/*.scss')
    .pipe(sass())
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(gulp.dest('app/css'))
    .pipe(browserSync.reload({
      stream: true
    }))
});

// Compiles Pug files from /pug into the root folder and beautifies the HTML
gulp.task('pug', function buildHTML() {
  return gulp.src('app/pug/*.pug')
    .pipe(pug())
    .pipe(beautify())
    .pipe(gulp.dest('dist'))
    .pipe(browserSync.reload({
      stream: true
    }))
});

// Copy vendor files from /node_modules into /vendor
gulp.task('copy', function() {

  //Images
  gulp.src(['app/img/**/*'])
    .pipe(gulp.dest('./dist'))
    
  // jQuery
  gulp.src([
      './node_modules/jquery/dist/jquery.min.js',
      '!./node_modules/jquery/dist/core.js'
    ])
    .pipe(gulp.dest('./app/vendor/jquery'))

  // jQuery Easing
  gulp.src([
      './node_modules/jquery.easing/*jquery.easing.min.js'
    ])
    .pipe(gulp.dest('./app/vendor/jquery-easing'))

    // Bootstrap
  gulp.src([
      './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
      './node_modules/bootstrap/dist/css/bootstrap.min.css'
    ])
    .pipe(gulp.dest('./app/vendor/bootstrap'))

//  // Font Awesome
//  gulp.src([
//      './node_modules/@fortawesome/fontawesome-free/css/all.min.css',
//    ])
//    .pipe(gulp.dest('./app/vendor/fontawesome-free'))
// 
//// Font Awesome webfonts
// gulp.src([
//      './node_modules/@fortawesome/fontawesome-free/webfonts/*',
//    ])
//    .pipe(gulp.dest('./dist/fonts'))
    
    

});

gulp.task('pack-css', function () {    
    return gulp.src(['./app/vendor/bootstrap/bootstrap.min.css',
                     './app/vendor/fontawesome-free/all.min.css',
                     './app/css/stylish-portfolio.css'])
        .pipe(concat('stylesheet.css'))
        .pipe(gulp.dest('./dist'))
        .pipe(browserSync.reload({
          stream: true
        }));
});

// Minify compiled CSS
//gulp.task('minify-css', ['sass'], function() {
//  return gulp.src('app/css/*.css')
//    .pipe(cleanCSS({
//      compatibility: 'ie8'
//    }))
//    .pipe(rename({
//      suffix: '.min'
//    }))
//    .pipe(gulp.dest('dist/css'))
//    .pipe(browserSync.reload({
//      stream: true
//    }))
//});

//// Minify custom JS
//gulp.task('minify-js', function() {
//  return gulp.src('app/js/*.js')
//    .pipe(uglify())
//    .pipe(header(banner, {
//      pkg: pkg
//    }))
//    .pipe(rename({
//      suffix: '.min'
//    }))
//    .pipe(gulp.dest('dist/js'))
//    .pipe(browserSync.reload({
//      stream: true
//    }))
//});

//Concat Tasks
gulp.task('pack-js', function () {    
    return gulp.src(['./app/vendor/jquery/jquery.min.js',
                     './app/vendor/bootstrap/bootstrap.bundle.min.js',
                     './app/vendor/jquery-easing/jquery.easing.min.js',
                     './app/js/stylish-portfolio.js'
                    ])
        .pipe(concat('bundle.js'))
        .pipe(gulp.dest('./dist'))
        .pipe(browserSync.reload({
          stream: true
        }));
        
});

// Default task
gulp.task('default', ['copy', 'sass', 'pack-css', 'pack-js', 'pug']);

// Configure the browserSync task
gulp.task('browserSync', function() {
  browserSync.init({
    server: {
      baseDir: 'dist'
    },
  })
});

// Dev task with browserSync
gulp.task('dev', ['browserSync', 'sass', 'pack-css', 'pack-js', 'pug'], function() {
  gulp.watch('app/scss/*.scss', ['sass']);
  gulp.watch('app/pug/**/*', ['pug']);
  gulp.watch('app/css/*.css', ['sass', 'pack-css']);
  gulp.watch('app/js/*.js', ['pack-js']);
  // Reloads the browser whenever HTML or JS files change
  gulp.watch('app/*.html', browserSync.reload);
  gulp.watch('app/js/**/*.js', browserSync.reload);
});
