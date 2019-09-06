const fs = require('fs');
const childProcess = require('child_process');
const args = require('yargs').argv;
const gulp = require('gulp');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const del = require('del');
const imagemin = require('gulp-imagemin');
const ts = require('gulp-typescript');

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

const tsProject = ts.createProject('tsconfig.json');

function tsCompile() {
  const tsResult = gulp.src('./src/ts/index.ts').pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('./build/js')).pipe(browserSync.stream());
}

function clean() {
  return del(['build/*']);
}

function imageMinify() {
  return gulp
    .src('./src/img/**/*')
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

function fonts() {
  return gulp.src('./src/fonts/*.*').pipe(gulp.dest('./build/fonts'));
}

function github() {
  return gulp.src('./build/**/*.*').pipe(gulp.dest('./docs'));
}

function lib() {
  return gulp.src('./src/lib/*.css').pipe(gulp.dest('./build/css/lib'));
}

function grid(done) {
  const format = args.env || 'scss';
  del.sync([`./src/scss/settings/_smart-grid.**`]);
  childProcess.execSync('node smart-grid-config.js ');
  fs.renameSync(
    `./src/scss/settings/smart-grid.${format}`,
    `./src/scss/settings/_smart-grid.${format}`,
    err => {
      if (err) console.error(`GRID-TASK ERROR: ${err}`);
    }
  );
  done();
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
  // gulp.watch('./src/ts/**/*.ts', tsCompile);
  gulp.watch('./src/index.html', html);
}

gulp.task('styles', styles);
gulp.task('watch', watch);
gulp.task('image:min', imageMinify);

/*
  gulp updateGrid --env {scss, less, sass ...} 
  формат должен совпадать c настройкой препроцессора
  в файле smart-grid-config.js
*/
gulp.task('updateGrid', grid);

gulp.task('scripts', scripts);
gulp.task(
  'build',
  gulp.series(
    clean,
    gulp.parallel(styles, scripts, fonts, lib, imageMinify),
    html
  )
);

gulp.task('dev', gulp.series('build', 'watch'));
gulp.task('github-pages:build', gulp.series('build', html, github));
