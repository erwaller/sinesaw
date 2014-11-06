gulp = require 'gulp'
gutil = require 'gulp-util'
source = require 'vinyl-source-stream'
browserify = require 'browserify'
connect = require 'gulp-connect'
stylus = require 'gulp-stylus'
autoprefixer = require 'autoprefixer-stylus'
buildStatus = require 'build-status'



statusServer = buildStatus.server()



gulp.task 'server', ->

  connect.server
    root: 'public'
    port: 3001


gulp.task 'js', ->

  statusServer.send 'building'
  browserify(
    entries: ['./app/scripts/index.coffee']
    extensions: ['.coffee', '.cjsx']
    debug: true
  )
    .bundle()
      .on 'error', (e) ->
        statusServer.send 'error'
        gutil.log "#{e}"
      .pipe source 'index.js'
      .pipe gulp.dest './public'
      .on 'end', ->
        statusServer.send 'done'


gulp.task 'watch-js', ['js'], ->

  gulp.watch ['./app/scripts/**'], ['js']


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

  gulp.watch ['./app/styles/**'], ['css']



gulp.task 'default', ['server', 'watch-js', 'watch-css']


