# sinesaw #

Web audio DAW.  Requires Chrome >= 39.

`npm install` and then `gulp` to run a server and watch coffee/styl source files


---


The idea behind sinesaw is to create an in browser DAW with an interface similar
to Ableton Live, but allowing concurrent collabarative editing by multiple
users.  In terms of latency and processing power, javascript will never complete
with native DAWs, but running in browser makes collaboration and sharing so easy
that I think there is an exciting place for it.  I hope the limitations in
processing power will inspire creativity more than hold users back.

Sinesaw is far from complete - so far it includes a piano roll editor, a working
analog synthesizer, drum synthesizer, and sampler.


### architecture

Sinesaw plays audio through through a single scriptProcessor audio node - the
audio output is a pure function of the song state and the current time.  This
single function is called in a worker thread for every sample of audio.

This approach to audio was inspired by the excellent
[wavepot](http://wavepot.com) project.

Sinesaw uses React.js for the user interface, and a custom
[Cursor](https://github.com/charlieschwabacher/cursor) library for immutable
data modeling.. Song state is kept in a single object shared between the ui and
the audio processing code.

The advantage of using immutable data is that React can quickly diff the objects
to determine what has changed, so that we can always render the ui from the top,
while still updating only the absolute minimum number of ui elements when
data changes.

We can use this same method to easily identify changes and keep state in sync
between multiple threads doing audio processing, multiple concurrent clients,
and a persistent document on the server.

For a more complete explanation of immutable data, check the readme for cursor.


### approaching the code

The best place to start looking at code for audio output is
`app/scripts/dsp/song.coffee`, and `app/scripts/ui/app.cjsx` is the entry
point for the UI code.

The index file for the code is `app/scripts/index.coffee` - this creates both a
`Song` model and the root react component `App`.

Planned work is in `todo.txt`
