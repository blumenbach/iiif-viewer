"use strict";
var $ =  require('jquery'),
  EventEmitter = require('events').EventEmitter;

var Viewer = function(parent, options) {
  EventEmitter.call(this);
  var viewer = this;
  var Client = require('node-rest-client').Client;
  var client = new Client();
  viewer.$manifestPicker = $('#manifestPicker');
  viewer.$images = $('#images-list');
  viewer.$images.empty();

  //viewer.wrapperElement = $('<div class="iiifviewer"></div>').appendTo($(parent));
  viewer.options = $.extend(true, {}, module.exports.defaults, options);
  viewer.init = function() {
    [
      {url: 'http://localhost:4010/example/test.json', label: 'localhost'},
      {
        url: 'http://demos.biblissima-condorcet.fr/iiif/metadata/BVMM/chateauroux/manifest.json',
        label: 'BNF Detail Images Demo (Chateauroux)'
      },
      {url: 'http://manifests.ydc2.yale.edu/manifest/Osbornfa1v2.json', label: "Yale Osborn with choice (see 53r)"},
      {
        url: 'http://dms-data.stanford.edu/data/manifests/BnF/jr903ng8662/manifest.json',
        label: 'Stanford DMS Manuscript (example of typical object)'
      }
    ].forEach(function (fixture) {
      $('<option>')
        .val(fixture.url)
        .text(fixture.label)
        .appendTo(viewer.$manifestPicker);
    });
    viewer.openSelectedManifest();
  };

  viewer.openSelectedManifest = function() {
    var self = this;
    var Client = require('node-rest-client').Client;
    var client = new Client();

    var manifestUrl = viewer.$manifestPicker.val();
    viewer.$images.empty();

    var args = {
      headers: { "Accept": "application/json" }
    };
    client.get(manifestUrl, args, function(manifest, response) {
      console.log(manifest);
      console.log(response);
      if (self.viewer) {
        self.viewer.destroy();
      }
    });
  };

  viewer.init();
  viewer.emit('ready');
  return viewer;
};

Viewer.prototype = new EventEmitter;

$( document ).ready( function () {
      new Viewer(parent);
});
module.exports.$ = $;
module.exports.defaults = require('./defaults.js');


