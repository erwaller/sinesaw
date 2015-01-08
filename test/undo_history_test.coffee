describe 'UndoHistory', ->

  # describe '#undo', ->

  #   it 'should do nothing when there is no history', ->
  #     o = root.get()
  #     undo()
  #     assert root.get() is o

  #   it 'should undo changes', ->
  #     root.set ['a', 'b', 'c'], 5, true
  #     assert root.get(['a', 'b', 'c']) is 5
  #     undo()
  #     assert root.get(['a', 'b', 'c']) is 1

  # describe '#redo', ->

  #   it 'should do nothing when there is no redo history', ->
  #     o = root.get()
  #     undo()
  #     assert root.get() is o

  #   it 'should redo changes', ->
  #     root.set ['a', 'b', 'c'], 5, true
  #     undo()
  #     assert root.get(['a', 'b', 'c']) is 1
  #     redo()
  #     assert root.get(['a', 'b', 'c']) is 5
