# sinesaw #

Web audio DAW.  Requires Chrome > 39.

`npm install` and then `gulp` to run server and watch coffee/styl source files


---


The idea behind sinesaw is to be an in browser DAW with an interface similar to
Ableton Live, but allowing live concurrent editing by multiple users.  In terms
of latency and processing power, javascript will never complete with native
DAWs, but running in browser makes collaboration and sharing so easy that I
think there is an exciting place for it.  I hope the limitations in processing
power will inspire creativity more than hold users back.

Sinesaw is far from complete - there is no concurrent editing or saving of songs
yet - but it is complete enough to be fun to use.  As far as I can tell, and for
what I am interested in doing, Sinesaw is the most advanced javascript DAW in
existence.


### architecture

Sinesaw plays audio through through a single scriptProcessor audio node - the
audio output is a pure function of the song state and the current time.  A
single function is called 48000 times / second, once for each sample, to fill
audio buffers.

Sinesaw uses React.js for the user interface, and the Cursor library for
immutable data modeling.. data is kept in a single object shared between the ui
and the audio processing code.  The advantages of using immutable data is that
React can quickly diff the objects to determine what has changed and allows us
to re-render only the absolute minimum number of ui elements when data changes.

Also, we can easily track changes in order to keep state in sync between
multiple threads doing audio processing, multiple concurrent clients, and a
persistent document on the server.

For a more complete explanation of immutable data, check the readme for cursor.


### approaching the code

The best place to start looking at code for audio output is
`app/scripts/models/song.coffee`, and `app/scripts/ui/app.cjsx` is the entry
point for the UI code.

The index file for the code is `app/scripts/index.coffee` - this creates both a
`Song` model and the root react component `App`.

Planned changes are in `todo.txt`
