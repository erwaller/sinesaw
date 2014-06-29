###* @jsx React.DOM ###

document.addEventListener 'DOMContentLoaded', ->
  React.renderComponent(
    `<div className="app">
      <div className="row ">
        <PianoRoll/>
      </div>
      <div className="row instrument">
        <div className="column channel">
          <Slider label="Level"/>
          <Knob label="Pan"/>
        </div>
        <div className="column">
          <Envelope label="Volume Env"/>
        </div>
        <div className="column">
          <Envelope label="Filter Env"/>
        </div>
        <div className="column oscillators">
          <Filter label="Filter"/>
          <Oscillator label="Osc 1"/>
          <Oscillator label="Osc 2"/>
        </div>
      </div>
    </div>`
  , document.body)