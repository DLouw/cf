// Load plugins
const autoprefixer = require("gulp-autoprefixer");
const browsersync = require("browser-sync").create();
const cleanCSS = require("gulp-clean-css");
const gulp = require("gulp");
var concat = require('gulp-concat');
var pug = require('gulp-pug');
const header = require("gulp-header");
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
const uglify = require("gulp-uglify");
const pkg = require('./package.json');

// Set the banner content
const banner = ['/*!\n',
  ' * Start Bootstrap - <%= pkg.title %> v<%= pkg.version %> (<%= pkg.homepage %>)\n',
  ' * Copyright 2013-' + (new Date()).getFullYear(), ' <%= pkg.author %>\n',
  ' * Licensed under <%= pkg.license %> (https://github.com/BlackrockDigital/<%= pkg.name %>/blob/master/LICENSE)\n',
  ' */\n',
  '\n'
].join('');

// Copy third party libraries from /node_modules into /vendor
gulp.task('vendor', function(cb) {

  // Bootstrap
  gulp.src([
      './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
      './node_modules/bootstrap/dist/css/bootstrap.min.css',
//      '!./node_modules/bootstrap/dist/css/bootstrap-grid*',
//      '!./node_modules/bootstrap/dist/css/bootstrap-reboot*'
    ])
    .pipe(gulp.dest('./vendor/bootstrap'))

  // Font Awesome
  gulp.src([
      './node_modules/@fortawesome/fontawesome-free/css/all.min.css',
    ])
    .pipe(gulp.dest('./vendor/fontawesome-free'))
 
// Font Awesome webfonts
 gulp.src([
      './node_modules/@fortawesome/fontawesome-free/webfonts/*',
    ])
    .pipe(gulp.dest('./build/webfonts'))

  // jQuery
  gulp.src([
      './node_modules/jquery/dist/jquery.min.js',
      //'!./node_modules/jquery/dist/core.js'
    ])
    .pipe(gulp.dest('./vendor/jquery'))

  // jQuery Easing
  gulp.src([
      './node_modules/jquery.easing/*jquery.easing.min.js'
    ])
    .pipe(gulp.dest('./vendor/jquery-easing'))

//  // Simple Line Icons
//  gulp.src([
//      './node_modules/simple-line-icons/fonts/**',
//    ])
//    .pipe(gulp.dest('./vendor/simple-line-icons/fonts'))
//
//  gulp.src([
//      './node_modules/simple-line-icons/css/**',
//    ])
//    .pipe(gulp.dest('./vendor/simple-line-icons/css'))

  cb();

});

//Compile Pug
gulp.task('pug', function() {
    return gulp.src('pug/*.pug')
     .pipe(pug())
     .pipe(beautify())
     .pipe(gulp.dest('build'))
     .pipe(browserSync.stream());
});

//CSS task
gulp.task("css", function(){
  return gulp.src("./scss/*.scss")
    .pipe(plumber())
    .pipe(sass({
      outputStyle: "expanded"
    }))
    .on("error", sass.logError)
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
      cascade: false
    }))
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(gulp.dest("./css"))
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(cleanCSS())
    .pipe(gulp.dest("./css"))
    .pipe(browsersync.stream());
})

// JS task
gulp.task("js", function() {
    return gulp.src([
      './js/*.js',
      '!./js/*.min.js',
      '!./js/contact_me.js',
      '!./js/jqBootstrapValidation.js'
    ])
    .pipe(uglify())
    .pipe(header(banner, {
      pkg: pkg
    }))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('./js'))
    .pipe(browsersync.stream());
})


//Concat Tasks
//gulp.task('pack-js', function () {    
//    return gulp.src(['vendor/jquery/jquery.min.js',
//                     'vendor/bootstrap/bootstrap.bundle.min.js',
//                     'vendor/jquery-easing/jquery.easing.min.js',
//                     'js/stylish-portfolio.js'
//                    ])
//        .pipe(concat('bundle.js'))
//        .pipe(gulp.dest('build/js'));
//        
//});
 
//function packCss(){
//    return gulp.src(['vendor/**/*.css', 'css/stylish-portfolio.css'])
//        .pipe(concat('stylesheet.css'))
//        .pipe(gulp.dest('build/css'))
//        .pipe(browsersync.stream());
//}
//
//function packJs(){
//    return gulp.src(['vendor/jquery/jquery.min.js',
//                     'vendor/bootstrap/bootstrap.bundle.min.js',
//                     'vendor/jquery-easing/jquery.easing.min.js',
//                     'js/stylish-portfolio.js'
//                    ])
//        .pipe(concat('bundle.js'))
//        .pipe(gulp.dest('build/js'))
//        .pipe(browsersync.stream());
//}

//gulp.task('pack-css', function () {    
//    return gulp.src(['vendor/**/*.css', 'css/stylish-portfolio.css'])
//        .pipe(concat('stylesheet.css'))
//        .pipe(gulp.dest('build/css'));
//});

// Tasks
//gulp.task("pack-css", packCss);
//gulp.task("pack-js", packJs);

// Default task
gulp.task('default', ['vendor', 'copy', 'pug', 'css', 'js']);

// Configure the browserSync task
gulp.task('browserSync', function() {
  browserSync.init({
    server: {
      baseDir: 'build'
    },
  })
});

// Dev task with browserSync
gulp.task('dev', ['browserSync', 'css', 'js', 'pug'], function() {
  gulp.watch('./scss/*.scss', ['sass']);
  gulp.watch('./pug/**/*', ['pug']);
  gulp.watch('./js/*.js', ['minify-js']);
  // Reloads the browser whenever HTML or JS files change
  gulp.watch('./*.html', browserSync.reload);
  gulp.watch('./js/**/*.js', browserSync.reload);
});
