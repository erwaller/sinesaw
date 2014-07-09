minEnvValue = 0.01

@envelope = (env, note, time) ->

  elapsed = time - note.time
  a = Math.max minEnvValue, env.a
  d = Math.max minEnvValue, env.d
  s = env.s
  r = Math.max minEnvValue, env.r

  # attack, decay, sustain
  l = if elapsed > a + d
    l = s
  else if elapsed > a
    l = s + (1 - s) * (a + d - elapsed) / d
  else
    elapsed / a

  # release
  if elapsed > note.len
    l = l * (r + note.len - elapsed) / r

  Math.max 0, l
