"use strict";
var $ =  require('jquery'),
    ui = require('jquery-ui'),
    Manifestor = require('./manifestor'),
    key = require('keymaster'),
    Client = require('node-rest-client').Client;
var io = require('socket.io-client');


var options = function(options) {
};

var Viewer = function(parent, options) {
    var viewer = this;
    viewer.options = $.extend(true, {}, module.exports.defaults, options);

    viewer.init = function () {
        viewer.$manifestPicker = $('#manifestPicker');
        viewer.$images = $('#images-list');
        viewer.$images.empty();

        [{url: 'http://localhost:4010/example/test.json', label: 'localhost'},
            {
                url: 'http://demos.biblissima-condorcet.fr/iiif/metadata/BVMM/chateauroux/manifest.json',
                label: 'BNF Detail Images Demo (Chateauroux)'
            },
            {
                url: 'http://manifests.ydc2.yale.edu/manifest/Osbornfa1v2.json',
                label: "Yale Osborn with choice (see 53r)"
            },
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

            var manifestUrl = viewer.$manifestPicker.val();
            viewer.$images.empty();

            var openSelectedManifest = function (manifestUrl, callback) {
                var args = {
                    headers: {"Accept": "application/json"}
                };
                var client = new Client();
                var responseData = {};
                client.get(manifestUrl, args, function (manifest, response) {
                    console.log(manifest);
                    console.log(response);
                    if (viewer.manifestor) {
                        viewer.manifestor.destroy();
                    }
                    viewer.manifestor = Manifestor({
                        manifest: manifest,
                        container: $('#example-container'),
                        perspective: 'overview',
                        canvasClass: 'canvas',
                        frameClass: 'frame',
                        labelClass: 'label',
                        viewportPadding: {
                            top: 0,
                            left: 10,
                            right: 10,
                            bottom: 10
                        }
                    });
                    viewer.manifestor.selectViewingMode(viewer.currentMode);
                    viewer.manifestor.on('detail-tile-source-requested', function (e) {
                    });
                    viewer.manifestor.on('viewer-state-updated', function () {
                        console.log('I have updated!');
                    });

                    viewer.$images.sortable({
                        stop: function (event, ui) {
                            var inputs = event.target.querySelectorAll('input');
                            var i = 0;
                            for (i; i < inputs.length; i++) {

                                // zIndex is backwards from this UI; 0 is on the bottom for zIndex, but 0 is the top
                                // of this sortable UI element array.
                                var image = viewer.selectedCanvas.getImageById(inputs[i].id);
                                viewer.selectedCanvas.moveToIndex(image, inputs.length - (i + 1));
                            }
                        }
                    });

                    var _setCheckbox = function (id, value) {
                        var checkbox = $('#' + id);
                        checkbox.prop('checked', value);
                    };

                    viewer.manifestor.on('image-hide', function (e) {
                        _setCheckbox(e.detail, false);
                    });

                    viewer.manifestor.on('image-show', function (e) {
                        _setCheckbox(e.detail, true);
                    });

                    viewer.manifestor.on('image-resource-tile-source-opened', function (e) {
                        _setCheckbox(e.detail.id, e.detail.visible);
                    });

                    var setImagesForCanvas = function (canvas) {
                        viewer.selectedCanvas = canvas;
                        viewer.$images.empty();

                        viewer.selectedCanvas.images.forEach(function (image) {
                            var text = image.label;
                            if (image.imageType === 'main') {
                                text += " (default)";
                            }
                            if (image.imageType === 'detail') {
                                text += " (detail)";
                            }
                            if (image.imageType !== 'thumbnail') {
                                var listItem = $('<li>');
                                var label = $('<label>').text(text);

                                var checkbox = $('<input type=checkbox>');
                                checkbox.prop('id', image.id);
                                checkbox.prop('checked', image.visible);

                                checkbox.change(image, function (event) {
                                    if (event.target.checked) {
                                        if (image.status === 'shown') {
                                            image.show();
                                        } else {
                                            viewer.selectedCanvas.removeThumbnail();
                                            image.openTileSource();
                                        }
                                    } else {
                                        image.hide();
                                    }
                                });
                                label.append(checkbox);
                                listItem.append(label);
                                listItem.prependTo(viewer.$images);
                            }
                        });
                    };

                    var selectedCanvas = viewer.manifestor.getSelectedCanvas();
                    if (selectedCanvas && viewer.manifestor.getState().perspective == 'detail') {
                        setImagesForCanvas(selectedCanvas);
                    }

                    viewer.manifestor.on('canvas-selected', function (event) {
                        setImagesForCanvas(event.detail);
                    });

                    key('shift+j', function () {
                        if (viewer.manifestor) {
                            viewer.manifestor.selectPerspective('detail');
                            var selectedCanvas = viewer.manifestor.getSelectedCanvas();
                            if (selectedCanvas) {
                                setImagesForCanvas(selectedCanvas);
                            }
                        }
                        console.log('shifting to detail perspective');
                    });

                    key('shift+k', function () {
                        if (viewer.manifestor) {
                            viewer.manifestor.selectPerspective('overview');
                            viewer.$images.empty();
                        }
                        console.log('shifting to overview perspective');
                    });
                    responseData = manifest;
                    callback(responseData);
                });
            };

        openSelectedManifest(manifestUrl, function (response) {
            var socket = io.connect('localhost:3001', {});
                var res = response.sequences[0].canvases[0].otherContent.resources[0].resource['@id'];
                var message = JSON.parse(JSON.stringify({
                    data: res
                }));
                socket.emit('message', message);
        });

        $('#manifestPicker').on('change', function () {
            openSelectedManifest();
        });

        $('#mode').on('change', function (e) {
            viewer.currentMode = e.target[e.target.selectedIndex].value;
            if (viewer.manifestor) {
                viewer.manifestor.selectViewingMode(viewer.currentMode);
            }
        });
        $('#readingDirection').on('change', function (e) {
            var value = e.target[e.target.selectedIndex].value;
            if (viewer.manifestor) {
                viewer.manifestor.selectViewingDirection(value);
            }
        });
        $('#scale').on('input', function () {
            if (viewer.manifestor) {
                viewer.manifestor.updateThumbSize($(this).val() * (1 / 100));
            }
        });

        key('m', function () {
            cycleViewingModes();
        });

        key('h, left', function () {
            if (viewer.manifestor) {
                viewer.manifestor.previous();
            }
        });

        key('l, right', function () {
            if (viewer.manifestor) {
                viewer.manifestor.next();
            }
        });

        $(window).on('resize', function () {
            if (viewer.manifestor) {
                viewer.manifestor.resize();
            }
        });

        var cycleViewingModes = function () {
            var newMode;
            if (viewer.currentMode === 'individuals') {
                newMode = 'paged';
            } else if (viewer.currentMode === 'paged') {
                newMode = 'continuous';
            } else if (viewer.currentMode === 'continuous') {
                newMode = 'individuals';
            }

            viewer.currentMode = newMode;
            $('#mode').val(viewer.currentMode);

            if (viewer.manifestor) {
                viewer.manifestor.selectViewingMode(newMode);
            }
        };
    };
    viewer.init();
    return viewer;
};

$(function(){
    new Viewer(parent, options);
});

module.exports.$ = $;
module.exports.defaults = require('./defaults.js');


