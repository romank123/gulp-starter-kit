const gulp = require('gulp');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const del = require('del');
const imagemin = require('gulp-imagemin');

const browserSync = require('browser-sync').create();

sass.compiler = require('node-sass');

const jsFiles = ['./src/js/script.js'];

function styles() {
  return gulp
    .src('./src/scss/**/*.scss')
    .pipe(sass({ outputStyle: 'uncompressed' }).on('error', sass.logError))
    .pipe(
      autoprefixer({
        browsers: ['> 0.1%'],
        cascade: false
      })
    )
    .pipe(cleanCSS({ level: 2 }))
    .pipe(gulp.dest('./build/css/'))
    .pipe(browserSync.stream());
}

function scripts() {
  return gulp
    .src(jsFiles)
    .pipe(concat('bundle.js'))
    .pipe(
      babel({
        presets: ['@babel/env']
      })
    )
    .pipe(
      uglify({
        toplevel: true
      })
    )
    .pipe(gulp.dest('./build/js/'))
    .pipe(browserSync.stream());
}

function clean() {
  return del(['build/*']);
}

function imageMinify() {
  return gulp
    .src('./src/img/*')
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.jpegtran({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [{ removeViewBox: true }, { cleanupIDs: false }]
        })
      ])
    )
    .pipe(gulp.dest('./build/img'));
}

function html() {
  return gulp
    .src('./src/*.html')
    .pipe(gulp.dest('./build'))
    .pipe(browserSync.stream());
}

function github() {
  return gulp.src('./build/**/*.*').pipe(gulp.dest('./docs'));
}

function watch() {
  browserSync.init({
    server: {
      baseDir: './build'
    },
    notify: false,

    // Cool!
    tunnel: false
  });
  gulp.watch('./src/scss/**/*.scss', styles);
  gulp.watch('./src/js/**/*.js', scripts);
  gulp.watch('./src/index.html', html);
}

gulp.task('styles', styles);
gulp.task('watch', watch);
gulp.task('image:min', imageMinify);

gulp.task('scripts', scripts);
gulp.task(
  'build',
  gulp.series(clean, gulp.parallel(styles, scripts, imageMinify), html)
);

gulp.task('dev', gulp.series('build', 'watch'));
gulp.task('github-pages:build', gulp.series('build', html, github));
