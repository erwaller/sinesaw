React = require('react');
App = require('./app.cjsx');

// // inject request animation frame batching strategy into react
// rafb = require('react-raf-batching')
// rafb.inject()

// load webfonts and mount app
// WebFont.load({
//   google: {
//     families: ['Roboto:300:latin']
//   },
//   active: function(){
//     React.renderComponent(App(), document.body);
//   }
// });

window.onload = function(){
  setTimeout(function(){
    React.renderComponent(App(), document.body);
  });
};