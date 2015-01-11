assert = require 'assert'
ImmutableData = require '../app/scripts/util/immutable_data'

# lower intervals in undo history
(require '../app/scripts/util/undo_history').prototype.defaultInterval = 1


describe 'Cursor', ->

  initialData = a: b: c: 1, d: 2
  root = null
  history = null



  beforeEach ->
    ImmutableData.create initialData, ->
      [root, history] = arguments
    , history: true



  describe '#get', ->

    it 'should preserve identity of data', ->
      assert root.get() is initialData

    it 'should return references to the same object in subsequent calls', ->
      assert root.get('a') is root.get('a')

    it 'should return expected values', ->
      assert root.get(['a', 'b', 'c']) is 1
      assert root.get(['a', 'b', 'd']) is 2


  describe '#set', ->

    it 'should set root value when called with one argument', ->
      root.set 7
      assert root.get() is 7
      assert root.get(['a', 'b', 'c']) is undefined

    it 'should set at path when called with two arguments', ->
      root.set ['a', 'e'], 3
      assert root.get(['a', 'e']) is 3

    it 'should replace parent objects', ->
      root.set ['a', 'e'], 3
      assert root.get() isnt initialData
      assert root.get('a') isnt initialData.a

    it 'should not replace objects that are not ancestors of changed value', ->
      root.set ['a', 'e'], 3
      assert root.get(['a', 'b']) is initialData.a.b

    it 'should clear keys below an object when set', ->
      root.set 'f', 11
      root.set [], {}
      assert root.get('a') is undefined
      assert root.get('f') is undefined


  describe '#cursor', ->

    # references to cursors should be cached so that two cursors w/ identical
    # path will be referentially equal if their target object is unchanged
    it 'should cache refrences to cursors', ->
      assert root.cursor('a') is root.cursor('a')
      assert root.cursor(['a', 'b']) is root.cursor('a').cursor('b')

    # changes to the target of a cursor should clear its cached reference so
    # that any new cursor sharing its path will no longer be referentially equal
    it 'should clear cached cursors when a value is changed', ->
      cursor = root.cursor('a')
      root.set ['a', 'e'], 4
      assert root.cursor('a') isnt cursor


  describe '#merge', ->

    it 'should set multiple keys at once', ->
      root.merge {a: b: c: 8, d: 9}
      assert root.get(['a', 'b', 'c']) is 8
      assert root.get(['a', 'b', 'd']) is 9

    it 'should not clear existing data', ->
      root.set ['a', 'e'], 4
      assert root.get(['a', 'e']) is 4
      assert root.get(['a', 'b', 'c']) is 1

    it 'should clear cached cursors along changed paths', ->
      cursor1 = root.cursor ['a', 'b']
      cursor2 = root.cursor ['a', 'e']
      root.merge a: b: c: 10
      assert root.cursor(['a', 'b']) isnt cursor1
      assert root.cursor(['a', 'e']) is cursor2


  describe 'setting data through subcursors', ->

    it 'should set data in the global object', ->
      cursor = root.cursor ['a', 'e']
      cursor.set [], 4
      assert root.get(['a', 'e']) is 4

    it 'should clear cached cursors when a value is changed', ->
      cursor = root.cursor ['a', 'e']
      cursor.set [], 4
      assert root.cursor(['a', 'e']) isnt cursor


  describe 'multiple cursors', ->

    # setting through cursors should work as expected even if changes have been
    # made to the underlying data after their creation
    it 'should set data when root object has changed after cursor creating', ->
      cursor1 = root.cursor ['a', 'b', 'c']
      cursor2 = root.cursor ['a', 'b', 'd']
      assert cursor1.get() is 1
      assert cursor2.get() is 2
      cursor1.set [], 5
      assert cursor1.get() is 5
      assert cursor2.get() is 2
      cursor2.set [], 6
      assert cursor1.get() is 5
      assert cursor2.get() is 6
      assert root.get(['a', 'b', 'c']) is 5
      assert root.get(['a', 'b', 'd']) is 6


  describe 'creating an empty cursor', ->

    it 'should create a cursor with null root node', ->
      ImmutableData.create null, (cursor) -> root = cursor
      assert root.get() is null


  describe '#undo', ->

    it 'should do nothing when there is no history', (done) ->
      o = root.get()
      history.undo()

      setTimeout ->
        assert.equal root.get(), o
        done()
      , 10

    it 'should undo changes', (done) ->
      root.set ['a', 'b', 'c'], 5

      setTimeout ->
        assert.equal root.get(['a', 'b', 'c']), 5
        history.undo()
        assert.equal root.get(['a', 'b', 'c']), 1
        done()
      , 10

  describe '#redo', ->

    it 'should do nothing when there is no redo history', (done) ->
      o = root.get()
      history.redo()

      setTimeout ->
        assert.equal root.get(), o
        done()
      , 10

    it 'should redo changes', (done) ->
      root.set ['a', 'b', 'c'], 5

      setTimeout ->
        history.undo()
        assert.equal root.get(['a', 'b', 'c']), 1
        history.redo()
        assert.equal root.get(['a', 'b', 'c']), 5
        done()
      , 10
