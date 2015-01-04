gulp = require 'gulp'
gutil = require 'gulp-util'
source = require 'vinyl-source-stream'
browserify = require 'browserify'
coffeeReactify = require 'coffee-reactify'
envify = require 'envify/custom'
brfs = require 'brfs'
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

  errorEmitted = false

  statusServer.send 'building'
  browserify(
    entries: ['./app/scripts/index.coffee']
    extensions: ['.coffee', '.cjsx']
    debug: true
  )
    .transform(coffeeReactify)
    .transform(envify NODE_ENV: 'development')
    .transform(brfs)
    .bundle()
      .on 'error', (e) ->
        errorEmitted = true
        statusServer.send 'error'
        gutil.log "#{e}"
        @emit 'end'
      .pipe source 'index.js'
      .pipe gulp.dest './public'
      .on 'end', ->
        statusServer.send 'done' unless errorEmitted


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


