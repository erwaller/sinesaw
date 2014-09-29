gulp = require 'gulp'
gutil = require 'gulp-util'
source = require 'vinyl-source-stream'
watchify = require 'watchify'
browserify = require 'browserify'
connect = require 'gulp-connect'
stylus = require 'gulp-stylus'
autoprefixer = require 'autoprefixer-stylus'


gulp.task 'server', ->

  connect.server
    root: 'public'
    port: 3001
    reload: true


gulp.task 'watch-js', ->

  bundler = watchify browserify
    cache: {}
    packageCache: {}
    fullPaths: false
    entries: ['./app/scripts/index.coffee']
    extensions: ['.coffee', '.cjsx']
    debug: true

  bundle = ->

    gutil.log 'building scripts'
    start = new Date

    bundler
      .bundle()
      .on 'error', (e) -> gutil.log "#{e}"
      .pipe source 'index.js'
      .pipe gulp.dest './public/'
      .pipe connect.reload()
      .on 'end', ->
        gutil.log "built scripts in #{new Date - start}ms"

  bundler.on 'update', bundle
  bundle()


gulp.task 'css', ->

  gulp
    .src './app/styles/index.styl'
    .pipe(
      stylus(
        use: autoprefixer browsers: ['ios 7']
        sourcemap:
          inline: true
          sourceRoot: '.'
          basePath: 'app/styles'
      )
    )
    .pipe gulp.dest './public'
    .pipe connect.reload()


gulp.task 'watch-css', ['css'], ->

  gulp.watch ['app/**'], ['css']


gulp.task 'default', ['server', 'watch-js', 'watch-css']
