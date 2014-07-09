@simpleEnvelope = (decay, elapsed) ->
  if elapsed > decay
    0
  else
    1 - elapsed / decay
