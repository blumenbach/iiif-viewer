'use strict';

require('openseadragon');
var ImageResource = require('./ImageResource');

var CanvasObject = function(config) {
  var self = this;
  this.clipRegion = config.clipRegion;
  this.opacity = config.opacity || 1;
  this.index = config.index;

  this.id = config.canvas['@id'];

  this.bounds = {
    x : config.x || 0,
    y : config.y || 0,
    height : config.canvas.height,
    width : config.canvas.width
  };
  this.thumbUrl = config.canvas.thumbnail;

  // todo: Move this logic into an ImageResourceFactory.
  this._getThumbService = function(width) {
    var image = config.canvas.images[0];
    if(image.resource.service) {
      return image.resource.service['@id'] + '/full/' + Math.ceil(width * 2) + ',/0/default.jpg';
    } else {
      return image.resource['@id'];
    }
  };

  this.label = config.canvas.label;
  this.viewingHint = config.canvas.viewingHint;

  this.dispatcher = config.dispatcher;
  this.viewer = config.viewer;
  this.images = [];
  // details and alternates possibly go here; disambiguate between them.
  if(config.canvas.images) {
    this.images = config.canvas.images.map(function(image) {

      // todo: Move this logic into an ImageResourceFactory.
      var _getImageTilesource = function(image) {
        if(image.resource.service) {
          return image.resource.service['@id'] + '/info.json';
        } else {
          return image.resource['@id'];
        }
      };

      return new ImageResource({
        tileSource: _getImageTilesource(image),
        parent: self,
        dispatcher: self.dispatcher
      });
    });
  }
};

CanvasObject.prototype = {
  openTileSource: function(imageIndex) {
    this.dispatcher.emit('detail-tile-source-opened', { 'detail': this.id });
    var self = this;
    var image = this.images[imageIndex];

    var onTileDrawn = function(event) {
      if(event.detail === image.tileSource) {
        self.dispatcher.removeListener('image-resource-tile-source-opened', onTileDrawn);
        image.hide();
        image.fade(1);

        if(self.thumbnail){
          self.thumbnail.destroy();
          self.images = self.images.splice(self.images.indexOf(self.thumbnail), 1);
          delete self.thumbnail;
        }
      }
    };

    this.dispatcher.on('image-resource-tile-source-opened', onTileDrawn);
    image.openTileSource();
  },

  openMainTileSource: function() {
    this.openTileSource(0);
  },

  openThumbnail: function() {
    if(!this.thumbUrl && this.images.length === 0) {
      // It may be the case that we have no images and no thumbnail in our canvas.
      return;
    }
    this.dispatcher.emit('detail-thumbnail-opened', { 'detail': this.id });

    this.thumbnail = new ImageResource({
      tileSource: {
        type: 'image',
        url: this.thumbUrl || this._getThumbService(this.bounds.width)
      },
      parent: this,
      dispatcher: this.dispatcher
    });

    this.thumbnail.openTileSource();
    this.images.push(this.thumbnail);
  },

  //Assumes that the point parameter is already in viewport coordinates.
  containsPoint: function(point) {
    var rectRight = this.bounds.x + this.bounds.width;
    var rectBottom = this.bounds.y + this.bounds.height;

    return (this.bounds.x <= point.x && rectRight >= point.x && this.bounds.y <= point.y && rectBottom >= point.y);
  },

  getVisibleImages: function() {
    return this.images.filter(function(image) { return image.visible === true; });
  },

  getDetailImages: function() {
    return this.images.filter(function(image) { return image.imageType === "detail" });
  },

  getAlternateImages: function() {
    return this.images.filter(function(image) { return image.imageType === "alternate" });
  },

  setBounds: function(x, y, width, height) {
    var self = this;
    this.bounds.x = x;
    this.bounds.y = y;
    this.bounds.width = width;
    this.bounds.height = height;

    this.images.forEach(function(image) {
      image.updateForParentChange(true);
    });
  },

  // Returns an OpenSeadragon Rect object - some OpenSeadragon consumers of this function want one,
  // and others can get x, y, width and height out easily.
  getBounds: function() {
    return new OpenSeadragon.Rect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
  },

  getAspectRatio: function() {
    return this.bounds.width / this.bounds.height;
  },

};

module.exports = CanvasObject;
