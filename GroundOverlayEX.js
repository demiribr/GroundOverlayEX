//////////////////////////////////////////////////////////////////////////////
// GroundOverlayEX module
//////////////////////////////////////////////////////////////////////////////
/*
Extended GroundOverlay class for Google Maps API V3
Version: 1.4

Source Respository: https://github.com/azmikemm/GroundOverlayEX
Documentation: see "documentation.txt" in github repository for full API description
Javascript libraries required:
	Google Maps API V3: "https://maps.google.com/maps/api/js?v=3&sensor=false"
	Numeric: from "http://numericjs.com"
Attributions: Mike Maschino, Google Maps API V3
License: MIT License

Copyright (c) 2015 Mike Maschino

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

//////////////////////////////////////////////////////////////////////////////
// GroundOverlayEX code
//////////////////////////////////////////////////////////////////////////////
var GROUNDOVERLAYEX_VERSION = "1.4";
var GOEX_EDITING_EXPANSE = 150;
var GOEX_ZINDEX_BASE_DEFAULT = 1000;
var GOEX_ZINDEX_EDITING_PLUSUP = 5000;
var GOEX_CURSORDIRECTIONS = [];
GOEX_CURSORDIRECTIONS[0] = "ew-resize";	// left
GOEX_CURSORDIRECTIONS[1] = "sw-resize";	// bottom-left
GOEX_CURSORDIRECTIONS[2] = "ns-resize";	// bottom
GOEX_CURSORDIRECTIONS[3] = "se-resize";	// bottom-right
GOEX_CURSORDIRECTIONS[4] = "ew-resize";	// right
GOEX_CURSORDIRECTIONS[5] = "ne-resize";	// top-right
GOEX_CURSORDIRECTIONS[6] = "ns-resize";	// top
GOEX_CURSORDIRECTIONS[7] = "nw-resize";	// top-left
function GOEXsign(x) { return x ? x < 0 ? -1 : 1 : 0; }
// Public methods
GroundOverlayEX.prototype = new google.maps.OverlayView();
window['GroundOverlayEX'] = GroundOverlayEX;
/**
 * @constructor
 */
function GroundOverlayEX(url, bounds, GO_opts) {
	// constructor for a new object; if both bounds and latlngQuad (in GO_opts) are provided, then latlngQuad overrules bounds (which will be ignored)
	// basic GO-opts: opacity, clickable, map
	// additional GO_opts:  rotate, origImgWidth, origImgHeight, cropFromLeft, cropFromBottom, cropToWidth, cropToHeight, latlngQuad
	// additional GO_opts:  id, displayText, zoomArray, regionBounds, draworder, zIndex, zIndexBase, editable, doEditing

	// initialize "public" class variables
	this.position = null;		// must be a LatLng

	// initialize supposedly "private" class variables
	this.id_ = "";
	this.manager_ = null;
	this.managerRecommendedLoad_ = false;
	this.displayText_ = "";
	this.bounds_ = null;
	this.boundsOrig_ = null;
	this.regionBounds_ = null;
	this.regionBoundsOrig_ = null;
	this.llqType_ = "u";		// R=rectangular, N=non-rectangular, u=unknown
	this.llq_ = null;
	this.llqOrig_ = null;
	if (bounds != undefined && bounds != null) { this.bounds_ = bounds; this.boundsOrig_ = bounds; }
  	this.url_ = url;
	this.zoomArray_ = null;
	this.GO_opts_ = GO_opts;
	this.clickable_ = false;
	this.clickableAtZoom_ = 0;
	this.clickableEvents_ = 127;	// 1=click, 2=dblclick, 4=rightclick, 8=mouseover, 16=mouseout, 32=mousedown, 64=mouseup
	this.displayMode_ = 'u';	// Q=latlngQuad, B=latlngBox, u=neither
	this.drawOrder_ = 0;
	this.zIndex_ = 0;
	this.zIndexBase_ = 0;
	this.opacity_ = 1;
	this.rotate_ = 0;
	this.clickStarted_ = false;
	this.qtyListeners_ = 0;
	this.qtyImgsLoaded_ = 0;
	this.memoryImgsLoaded_ = 0;
	this.cropping_ = false;
	this.overCropped_ = false;
	this.cropBase_ = null;
	this.origImgWidth_ = -1;
	this.origImgHeight_ = -1;
	this.cropFromLeft_ = 0;
	this.cropFromBottom_ = 0;
	this.cropToWidth_ = 0;
	this.cropToHeight_ = 0;
	this.mapAdded_ = false;
	this.imgDisplayed_ = -1;
	this.imgs_ = [];
	this.imgsLoaded_ = [];
	this.imgsRetry_ = [];
	this.display_element_ = null;
	this.editable_ = false;
	this.doEditing_ = false;
	this.isEditing_ = false;
	this.editingForbidNonrect_ = false;
	this.editingImageLoadedCallback_ = null;
	this.editing_revert_element_ = null;
	this.editing_elements_ = [];
	this.mousemoveState_ = 0;
	this.mousemovePrevX_ = 0;
	this.mousemovePrevY_ = 0;
	this.mousemoveHandle_ = 0;
	this.mapListener1_ = null;
	this.mapListener2_ = null;
	this.mapListener3_ = null;
	this.imageListener1_ = null;
	this.imageListener2_ = null;
	this.imageListener3_ = null;
	this.imageListener4_ = null;
	this.imageListener5_ = null;
	this.imageListener6_ = null;
	this.imageListener7_ = null;
	this.editListener1_ = null;
	this.editListener2_ = null;
	this.editListener3_ = null;

	// process any passed options
	if (GO_opts != undefined && GO_opts != null) {
		if (GO_opts.opacity != undefined) { this.setOpacity(Number(GO_opts.opacity)); }
		if (GO_opts.clickable != undefined) { if (GO_opts.clickable == true) this.clickable_ = true; }
		if (GO_opts.clickableAtZoom != undefined) { if (Number(GO_opts.clickableAtZoom) >= 0) this.clickableAtZoom_ = Number(GO_opts.clickableAtZoom); }
		if (GO_opts.id != undefined) { this.id_ = GO_opts.id; }
		if (GO_opts.displayText != undefined) { this.setDisplayText(GO_opts.displayText); }
		if (GO_opts.rotate != undefined) { this.setRotation_(Number(GO_opts.rotate)); }
		if (GO_opts.drawOrder != undefined) { this.setDrawOrder(Number(GO_opts.drawOrder)); }
		if (GO_opts.zIndex != undefined) { this.setzIndex(Number(GO_opts.zIndex)); }
		if (GO_opts.zIndexBase != undefined) { this.zIndexBase(Number(GO_opts.zIndexBase)); }
		if (GO_opts.origImgWidth != undefined) { if (Number(GO_opts.origImgWidth) > 0) { this.origImgWidth_ = Math.round(Number(GO_opts.origImgWidth)); } }
		if (GO_opts.origImgHeight != undefined) { if (Number(GO_opts.origImgHeight) > 0) { this.origImgHeight_ = Math.round(Number(GO_opts.origImgHeight)); } }
		if (GO_opts.cropFromLeft != undefined) { if (Number(GO_opts.cropFromLeft) > 0) { this.cropFromLeft_ = Math.round(Number(GO_opts.cropFromLeft)); } }
		if (GO_opts.cropFromBottom != undefined) { if (Number(GO_opts.cropFromBottom) > 0) { this.cropFromBottom_ = Math.round(Number(GO_opts.cropFromBottom)); } }
		if (GO_opts.cropToWidth != undefined) { if (Number(GO_opts.cropToWidth) > 0) { this.cropToWidth_ = Math.round(Number(GO_opts.cropToWidth)); } }
		if (GO_opts.cropToHeight != undefined) { if (Number(GO_opts.cropToHeight) > 0) { this.cropToHeight_ = Math.round(Number(GO_opts.cropToHeight)); } }
		if (GO_opts.latlngQuad != undefined && GO_opts.latlngQuad != null) { this.llq_ = GO_opts.latlngQuad; this.llqType_ = "N"; this.llqOrig_ = GO_opts.latlngQuad; this.bounds_ = null; }
		if (GO_opts.regionBounds != undefined && GO_opts.regionBounds != null) { this.regionBounds_ = GO_opts.regionBounds; this.regionBoundsOrig_ = GO_opts.regionBounds; }
		if (GO_opts.zoomArray != undefined && GO_opts.zoomArray != null) { this.zoomArray_ = GO_opts.zoomArray; }
		if (GO_opts.editable != undefined) { if (GO_opts.editable == true) this.setEditable(true); }
		if (GO_opts.clickableEvents != undefined) {
			// this.clickableEvents_: 1=click, 2=dblclick, 4=rightclick, 8=mouseover, 16=mouseout, 32=mousedown, 64=mouseup
			str = String(GO_opts.clickableEvents);
			if (str.length > 0) {
				this.clickableEvents_ = 0;
				tokens = str.split(",");
				for (var i in tokens) {
					if (tokens[i] == "click") this.clickableEvents_ |= 1;
					else if (tokens[i] == "dblclick") this.clickableEvents_ |= 2;
					else if (tokens[i] == "rightclick") this.clickableEvents_ |= 4;
					else if (tokens[i] == "mouseover") this.clickableEvents_ |= 8;
					else if (tokens[i] == "mouseout") this.clickableEvents_ |= 16;
					else if (tokens[i] == "mousedown") this.clickableEvents_ |= 32;
					else if (tokens[i] == "mouseup") this.clickableEvents_ |= 64;
					else if (tokens[i] == "all") this.clickableEvents_ |= 127;
				}
			}
		}
	}

	// create a single-entry zoomArray if one was not provided in the constructor options;
	// otherwise ensure url is in the zoomArray
	if (this.zoomArray_ == null) {
		var zl = new ZoomArray();
		var ze1 = new ZoomEntryZoom(0, 22, url);
		zl.addZoomEntry(ze1);
		this.zoomArray_ = zl;
	} else if (this.zoomArray_.length() == 0) {
		var zl = new ZoomArray();
		var ze1 = new ZoomEntryZoom(0, 22, url);
		zl.addZoomEntry(ze1);
		this.zoomArray_ = zl;
	} else {
		// ensure url is in the zoomArray, else add it
		var r = this.zoomArray_.whichIndexPerUrl(this.url_);
		if (r == -1) {
			var ze1 = new ZoomEntryZoom(-1, -1, url);
			this.zoomArray_.prependZoomEntry(ze1);
		}
	}

	// initialize the image loading arrays
	var c = this.zoomArray_.length();
	for (var i=0; i<c; i++) {
		this.imgsLoaded_[i] = 0;
		this.imgs_[i] = null;
		this.imgsRetry_[i] = 0;
	}

	// establish regionBounds if one is not specified; must be done before onAdd;
	// also establish position
	if (this.llq_ != null) {
		this.displayMode_ = "Q";
		this.position =	this.llq_.getPosition();
		if (this.regionBounds_ == null) { 
			this.regionBounds_ = this.llq_.getBoundsBox(); 
		}
	} else if (this.bounds_ != null) {
		this.displayMode_ = "B";
		this.position =	this.bounds_.getCenter();
		if (this.regionBounds_ == null) { 
			this.regionBounds_ = bounds; 
		}
	} else {
		this.displayMode_ = "u";
		this.position = null;
	}

	// assess cropping information
	if (this.cropFromLeft_ > 0 || this.cropFromBottom_ > 0 || this.cropToWidth_ > 0 || this.cropToHeight_ > 0) { 
		this.cropping_ = true;
		if (this.origImgWidth_ > 0 && this.origImgHeight_ > 0) {
			this.recordCropBase_();
		}
	}

	// pre-construct the proper idle display element
	if (this.displayMode_ == "Q") {
		this.display_element_ = new GroundOverlayEX_element_imageLLQ(this);
	} else if (this.displayMode_ == "B") {
		this.display_element_ = new GroundOverlayEX_element_imageLLB(this);
	}

	// this needs to be the very last thing done	
	if (GO_opts != undefined && GO_opts != null) { 
		if (GO_opts.map != undefined && GO_opts.map != null) { this.setMap(GO_opts.map); }
	}
}
GroundOverlayEX.prototype['destroy'] = GroundOverlayEX.prototype.destroy;
GroundOverlayEX.prototype.destroy = function() {
	// destructor call; not recoverable
	this.OnRemove();

	this.position = null;
	this.manager_ = null;
	this.bounds_ = null;
	this.boundsOrig_ = null;
	this.regionBounds_ = null;
	this.regionBoundsOrig_ = null;
	if (this.llq_ != null) this.llq_.destroy();
	this.llq_ = null;
	if (this.llqOrig_ != null) this.llqOrig_.destroy();
	this.llqOrig_ = null;
	if (this.zoomArray_ != null) this.zoomArray_.destroy();
	this.zoomArray_ = null;
	this.GO_opts_ = null;
	this.cropBase_ = null;
	this.imgs_ = null;
	this.imgsLoaded_ = null;
	this.imgsRetry_ = null;
	this.display_element_ = null;
	this.editingImageLoadedCallback_ = null;
	this.editing_revert_element_ = null;
	this.editing_elements_ = null;
}

////////////////////////
// baseline capabilities
// public methods
////////////////////////
GroundOverlayEX.prototype['onAdd'] = GroundOverlayEX.prototype.onAdd;
GroundOverlayEX.prototype.onAdd = function() {
	// this gets called by the Google Maps framework when the this.setMap gets called with a non-null value
	this.mapAdded_ = true;
	if (this.bounds_ != null || this.llq_ != null) {
		// geoLocation information was provided; setup needed listeners
		this.emplaceProperListeners_();	

		// assess whether there is sufficient information to perform the required cropping or respond to events
		if (this.zoomArray_.length() > 1) {
			if (this.cropping_ || this.clickable_) {
			 	if (this.origImgWidth_ <= 0 || this.origImgHeight_ <= 0) {
					// nope, need to force load the passed url image
					var r = this.zoomArray_.whichIndexPerUrl(this.url_);
					this.doLoadImageNumber_(r);
				}
			}
		}
		
		// initiate assessment of the GOEX's region with what the map is showing
		this.assessRegion_();
	} else {
		// missing geolocation information; application may be an editing web-app so force-load the passed image url
		var r = this.zoomArray_.whichIndexPerUrl(this.url_);
		this.doLoadImageNumber_(r);
	}	
}
GroundOverlayEX.prototype['onRemove'] = GroundOverlayEX.prototype.onRemove;
GroundOverlayEX.prototype.onRemove = function() {
	// this get called when the Google Maps framework is removing the GroundOverlay;
	// the manager class will do this often if enabled;
	// however it is not a destructor, and needs to be recoverable upon a subsequence OnAdd call
	this.doDisplayImageNumber_(-1);		// this also auto-clears editing
	this.removeAllListeners_();		// do not do this before the doDisplayImageNumber_(-1) call
	this.unloadAllImgs_();			// do not do this before the doDisplayImageNumber_(-1) call
	this.mapAdded_ = false;
}
GroundOverlayEX.prototype['draw'] = GroundOverlayEX.prototype.draw;
GroundOverlayEX.prototype.draw = function() {
	// this gets called whenever the Google Maps framework needs to have the overlay re-drawn (typically 1st time and map zooming);
	// this also gets called when images are swapped due to panning and zooming;
	// hence we always need to translate latlngs to map coordinates
	// need to assist the garbage collect process since this gets called lot and creates objects and arrays
	if (this.display_element_.isMapped_()) {
 		var overlayProjection = this.getProjection();
		if (this.displayMode_ == "Q") {
			// rectangular or non-rectangular latlngQuad method; build the corner x,y dataset; corners order is BL, BR, TR, TL
			// need to "DivPixel" in this case since we are working within the Map Div context
			var blLL = this.llq_.getBottomLeft();
			var brLL = this.llq_.getBottomRight();
			var trLL = this.llq_.getTopRight();
			var tlLL = this.llq_.getTopLeft();
			var gmpoint1 = overlayProjection.fromLatLngToDivPixel(blLL);
			var gmpoint2 = overlayProjection.fromLatLngToDivPixel(brLL);
			var gmpoint3 = overlayProjection.fromLatLngToDivPixel(trLL);
			var gmpoint4 = overlayProjection.fromLatLngToDivPixel(tlLL);
			blLL = null;	// explicitly pre-release the google maps LatLng objects
			brLL = null;
			trLL = null;
			tlLL = null;

			// deliberately create a new array object with sub-arrays; this array will be stored in the this.display_element_ object, and any prior array released
			var corners = [];
			var point1 = [0,0];
			point1[0] = Math.round(gmpoint1.x);
			point1[1] = Math.round(gmpoint1.y);
			corners[0] = point1;
			var point2 = [0,0];
			point2[0] = Math.round(gmpoint2.x);
			point2[1] = Math.round(gmpoint2.y);
			corners[1] = point2;
			var point3 = [0,0];
			point3[0] = Math.round(gmpoint3.x);
			point3[1] = Math.round(gmpoint3.y);
			corners[2] = point3;
			var point4 = [0,0];
			point4[0] = Math.round(gmpoint4.x);
			point4[1] = Math.round(gmpoint4.y);
			corners[3] = point4;

			// put the image into its proper place
			this.display_element_.doDrawLLQ_(corners);

			// make proper changes to editing div's if present using the results of the corners just set
			var bb = this.display_element_.getBoundsBox_();		// returns BL, TR, size
			for (var i in this.editing_elements_) {
				this.editing_elements_[i].adjustDrawLLQ_(bb);
			}
			bb = null;

		} else if (this.displayMode_ == "B") {
			// rectangular latlngBox method;
			// need to "DivPixel" in this case since we are working within the Map Div context;
			var swLL = this.bounds_.getSouthWest();
			var neLL = this.bounds_.getNorthEast();
 			var sw = overlayProjection.fromLatLngToDivPixel(swLL);
 			var ne = overlayProjection.fromLatLngToDivPixel(neLL);
			swLL = null;	// explicitly pre-release the google maps LatLng objects
			neLL = null;
			var nonBorderLeft = Math.round(sw.x);
			var nonBorderTop = Math.round(ne.y)	
			var nonBorderWidth = Math.round(ne.x - sw.x);
			var nonBorderHeight = Math.round(sw.y - ne.y);
			sw = null;	// explicitly release the google maps Point objects
			ne = null;

			// re-size and re-position (non-rotated) the image;
			// then perform rotation which will also recompute the LLQ and the RegionBounds
			this.display_element_.doDrawLLB_(nonBorderLeft, nonBorderTop, nonBorderWidth, nonBorderHeight);
			this.setRotation_(this.rotate_);

			// make proper changes to editing div's if present
			for (var i in this.editing_elements_) {
				// always do size before position
				this.editing_elements_[i].adjustDrawLLB_(nonBorderLeft, nonBorderTop, nonBorderWidth, nonBorderHeight);
			}
		}
		// reset opacity of the displayed image		
		this.display_element_.doOpacity_();
	}
}
GroundOverlayEX.prototype['getBounds'] = GroundOverlayEX.prototype.getBounds;
GroundOverlayEX.prototype.getBounds = function() {
	// current bounds (from constructor or from editing); null is a possible return value if not available
	return this.bounds_;
}
GroundOverlayEX.prototype['getUrl'] = GroundOverlayEX.prototype.getUrl;
GroundOverlayEX.prototype.getUrl = function() {
	// image URL as defined by the constructor
	return this.url_;
}
GroundOverlayEX.prototype['getOpacity'] = GroundOverlayEX.prototype.getOpacity;
GroundOverlayEX.prototype.getOpacity = function() {
	// current opacity setting (0=invisible to 1=opaque)
	return this.opacity_;
}
GroundOverlayEX.prototype['setOpacity'] = GroundOverlayEX.prototype.setOpacity;
GroundOverlayEX.prototype.setOpacity = function(pOpacity) {
	// change opacity (0=invisible to 1=opaque)
	if (pOpacity < 0) { this.opacity_ = 0; }
	else { 
		if (pOpacity > 1) { this.opacity_ = 1; }
		else { this.opacity_ = pOpacity; }
	}
	if (this.display_element_.isMapped_()) { this.display_element_.doOpacity_(); }
}

////////////////////////
// extended capabilities
// public methods
////////////////////////
GroundOverlayEX.prototype['getVersion'] = GroundOverlayEX.prototype.getVersion;
GroundOverlayEX.prototype.getVersion = function() {
	return GROUNDOVERLAYEX_VERSION;
}
GroundOverlayEX.prototype['getDisplayMode'] = GroundOverlayEX.prototype.getDisplayMode;
GroundOverlayEX.prototype.getDisplayMode = function() {
	// return: String={u=unknown, B=LatLngBounds, Q=LatLngQuad}
	return this.displayMode_;
}
GroundOverlayEX.prototype['getPosition'] = GroundOverlayEX.prototype.getPosition;
GroundOverlayEX.prototype.getPosition = function() {
	// return: google.maps.LatLng=the approximate center of the image; it is the center of the .bounds_ or.llq_.getBoundingBox() (which will NOT be the center of the non-rectangular image)
	// this is usually used to support the Google Maps API such as InfoWIndow
	return this.position;
}
GroundOverlayEX.prototype['getCenter'] = GroundOverlayEX.prototype.getCenter;
GroundOverlayEX.prototype.getCenter = function() {
	// return: google.maps.LatLng=the true center of the image (even non-rectangular images which uses the bimedians method)
	var center;
	if (this.displayMode_ == "Q") { center = this.llq_.getCenter(); }
	else {center = this.bounds_.getCenter(); }
	return center;
}
GroundOverlayEX.prototype['getId'] = GroundOverlayEX.prototype.getId;
GroundOverlayEX.prototype.getId = function() {
	// return: the application-defined ID associated with this GOEX; is whatever object was passed in the constructor
	return this.id_;
}
GroundOverlayEX.prototype['getDisplayText'] = GroundOverlayEX.prototype.getDisplayText;
GroundOverlayEX.prototype.getDisplayText = function() {
	// return: String=the display text or html to be used in an InfoWindow when the image is clicked
	return this.displayText_;
}
GroundOverlayEX.prototype['setDisplayText'] = GroundOverlayEX.prototype.setDisplayText;
GroundOverlayEX.prototype.setDisplayText = function(pText) {
	// pText: String=containing the display text or html to be used in an InfoWindow when the image is clicked; "" or null is acceptable and means show no InfoWindow
	this.displayText_ = pText;
}
GroundOverlayEX.prototype['getBoundsOriginal'] = GroundOverlayEX.prototype.getBoundsOriginal;
GroundOverlayEX.prototype.getBoundsOriginal = function() {
	// return: google.maps.LatLngBounds=original bounds from the constructor; null is a possible return value if not available
	return this.boundsOrig_;
}
GroundOverlayEX.prototype['getLatLngQuad'] = GroundOverlayEX.prototype.getLatLngQuad;
GroundOverlayEX.prototype.getLatLngQuad = function() {
	// return: LatLngQuad=current LatLngQuad (from constructor, derived, or from editing); null is a possible return value if not available
	if (this.llq_ == null) {
		if (this.displayMode_ == "B" && this.display_element_.isMapped_()) { this.computeLLQfromBounds_(); }
	}
	return this.llq_;
}
GroundOverlayEX.prototype['getLatLngQuadType'] = GroundOverlayEX.prototype.getLatLngQuadType;
GroundOverlayEX.prototype.getLatLngQuadType = function() {
	// return: String={u=unknown, R=rectangular, N=nonrectangular}
	return this.llqType_;
}
GroundOverlayEX.prototype['getLatLngQuadOriginal'] = GroundOverlayEX.prototype.getLatLngQuadOriginal;
GroundOverlayEX.prototype.getLatLngQuadOriginal = function() {
	//  return: LatLngQuad=original LatLngQuad from the constructor; null is a possible return value if not available
	return this.llqOrig_;
}
GroundOverlayEX.prototype['getOverCropped'] = GroundOverlayEX.prototype.getOverCropped;
GroundOverlayEX.prototype.getOverCropped = function() {
	// return: true=overcropped and image likely invisible; false=image properly cropped (or not cropped)
	return this.overCropped_;
}
GroundOverlayEX.prototype['getRegionBounds'] = GroundOverlayEX.prototype.getRegionBounds;
GroundOverlayEX.prototype.getRegionBounds = function() {
	// return: maps.google.LatLngBounds=region bounds (either directly specified during constructor or subsequently calculated)
	return this.regionBounds_;
}
GroundOverlayEX.prototype['getRotation'] = GroundOverlayEX.prototype.getRotation;
GroundOverlayEX.prototype.getRotation = function() {
	// return: Number=image rotation in degrees counter-clockwise; meaningless for a LatLngQuad-mode
	return this.rotate_;
}
GroundOverlayEX.prototype['getDrawOrder'] = GroundOverlayEX.prototype.getDrawOrder;
GroundOverlayEX.prototype.getDrawOrder = function() {
	// return: Number=current drawing order; if zIndex is specified then this is ignored; 0=use ZindexBase value or its default
	return this.drawOrder_;
}
GroundOverlayEX.prototype['setDrawOrder'] = GroundOverlayEX.prototype.setDrawOrder;
GroundOverlayEX.prototype.setDrawOrder = function(pDrawOrder) {
	// pDrawOrder: Number=set the drawing order; if zIndex is specified then this is ignored; 0=use ZindexBase value or its default
	if (pDrawOrder < 0) { this.drawOrder_ = 0; }
	else { this.drawOrder_ = pDrawOrder; }
	this.doZindex_();	
}
GroundOverlayEX.prototype['getZindex'] = GroundOverlayEX.prototype.getZindex;
GroundOverlayEX.prototype.getZindex = function() {
	// return: Number=current zIndex; if zIndex is specified then drawOrder is ignored; 0=use drawOrder instead
	return this.zIndex_;
}
GroundOverlayEX.prototype['setZindex'] = GroundOverlayEX.prototype.setZindex;
GroundOverlayEX.prototype.setZindex = function(pZindex) {
	// pZindex: Number=set the zIndex; if zIndex is specified then drawOrder is ignored; 0=use drawOrder instead
	if (pZindex < 0) { this.zIndex_ = 0; }
	else { this.zIndex_ = pZindex; }
	this.doZindex_();	
}
GroundOverlayEX.prototype['getZindexBase'] = GroundOverlayEX.prototype.getZindexBase;
GroundOverlayEX.prototype.getZindexBase = function() {
	// return: Number=current zIndex base; this value is added to the drawOrder to determine the zIndex to be used; ignored if zIndex is specified;
	// if set to zero, a default ZindexBase of 10,000 is used
	return this.zIndexBase_;
}
GroundOverlayEX.prototype['setZindexBase'] = GroundOverlayEX.prototype.setZindexBase;
GroundOverlayEX.prototype.setZindexBase = function(pZindexBase) {
	// pZindexBase: Number=set the zIndex base; this value is added to the drawOrder to determine the zIndex to be used; ignored if zIndex is specified;
	// if set to zero, a default ZindexBase of 10,000 is used
	if (pZindexBase < 0) { this.zIndexBase_ = 0; }
	else { this.zIndexBase_ = pZindexBase; }
	this.doZindex_();	
}
GroundOverlayEX.prototype['getEffectiveZindex'] = GroundOverlayEX.prototype.getEffectiveZindex;
GroundOverlayEX.prototype.getEffectiveZindex = function() {
	var zIndex = GOEX_ZINDEX_BASE_DEFAULT;
	if (this.zIndex_ > 0) zIndex = this.zIndex_;
	else {
		if (this.zIndexBase_ > 0) zIndex = this.zIndex_;
		zIndex += this.drawOrder_;
	}
	if (this.isEditing_) zIndex += GOEX_ZINDEX_EDITING_PLUSUP;
	return zIndex;
}

////////////////////////
// Manager interface methods
// non-public methods
////////////////////////
GroundOverlayEX.prototype.mgrRecommendLoadImage = function() {
	if (!this.mapAdded_ || this.zoomArray_ == null) {
		// GOEX is not ready to perform loads
		this.managerRecommendedLoad_ = true;
	} else {
		// GOEX can perform loads
		var zoom = this.map.getZoom();
		var r = this.zoomArray_.whichIndexPerZoom(zoom);
		if (r >= 0) {
			// an image at this zoom level is to be displayed
			if (this.imgsLoaded_[r] == 0) {
				// image has not yet been loaded
				this.doLoadImageNumber_(r);
			}
		}
	}
}
GroundOverlayEX.prototype.mgrGetStats = function() {
	var theResults = [0,0,0,0,0,0,0,0];

	if (this.mapAdded_) theResults[0] = 1;							// GOEX has been placed under google maps management

	theResults[1] = this.qtyListeners_;							// quantity of enabled listeners

	for (var i in this.imgs_) {
		if (this.imgsLoaded_[i] == 1) theResults[2]++					// quantity of in-progress image downloads
		else if (this.imgsLoaded_[i] >= 2) {			
			theResults[3]++;							// quantity of fully downloaded images
			theResults[4] += (this.imgs_[i].width * this.imgs_[i].height);		// quantity of size of downloaded images
		}
		theResults[5] += this.imgsRetry_[i];						// quantity of recent retry attempts
	}

	theResults[6] = 1;									// quantity of loaded elements
	if (this.editing_elements_ != null) theResults[6] += this.editing_elements_.length;
	if (this.display_element_.isMapped_()) theResults[7] = 1;				// image is showing on the map
	return theResults;
}

////////////////////////
// private methods (well - cannot enforce they are private)
////////////////////////
GroundOverlayEX.prototype.emplaceProperListeners_ = function() {
	// this.clickableEvents_: 1=click, 2=dblclick, 4=rightclick, 8=mouseover, 16=mouseout, 32=mousedown, 64=mouseup
	if (!this.mapAdded_) return;
	this.qtyListeners_ = 2;
	var that = this;
	if (this.mapListener1_ == null) {
		this.mapListener1_ = google.maps.event.addListener(this.map, "bounds_changed", function() { GroundOverlayEX_mapBoundsChanged_(that); });
	}
	if (this.display_element_.isMapped_() && (this.shouldClickable_(1) || this.displayMode_ == "Q")) {
		this.qtyListeners_++;
		if (this.mapListener2_ == null) {
			// listen to the map drag event to kludge fix bugs in browsers with non-rendering portions of the transform'ed image
			this.mapListener2_ = google.maps.event.addDomListener(this.map, "drag", function() { GroundOverlayEX_mapDrag_(that); });
		}
	} else {
		if (this.mapListener2_ != null) { google.maps.event.removeListener(this.mapListener2_); this.mapListener2_ = null; }
	}
	if (this.mapListener3_ == null) {
		this.mapListener3_ = google.maps.event.addListener(this.map, "zoom_changed", function() { GroundOverlayEX_mapZoomChanged_(that); });
	}

	if (this.display_element_.isMapped_()) {
		if (this.shouldClickable_(32) || this.editable_) {
			this.qtyListeners_++; 
			if (this.imageListener1_ == null) { this.imageListener1_ = google.maps.event.addDomListener(this.display_element_.node_, "mousedown", function(evt) { GroundOverlayEX_imageMouseDown_(that, evt); }); }
		} else {
			if (this.imageListener1_ != null) { google.maps.event.removeListener(this.imageListener1_); this.imageListener1_ = null; }
		}
		if (this.shouldClickable_(64) || this.editable_) {
			this.qtyListeners_++; 
			if (this.imageListener2_ == null) { this.imageListener2_ = google.maps.event.addDomListener(this.display_element_.node_, "mouseup", function(evt) { GroundOverlayEX_imageMouseUp_(that, evt); }); }
		} else {
			if (this.imageListener2_ != null) { google.maps.event.removeListener(this.imageListener2_); this.imageListener2_ = null; }
		}
		if (this.shouldClickable_(1) || this.isEditing_) {
			this.qtyListeners_++; 
			if (this.imageListener3_ == null) { this.imageListener3_ = google.maps.event.addDomListener(this.display_element_.node_, "click", function(evt) { GroundOverlayEX_imageClicked_(that, evt); }); }
		} else {
			if (this.imageListener3_ != null) { google.maps.event.removeListener(this.imageListener3_); this.imageListener3_ = null; }
		}
		if (this.shouldClickable_(2) || this.isEditing_) {
			this.qtyListeners_++; 
			if (this.imageListener4_ == null) { this.imageListener4_ = google.maps.event.addDomListener(this.display_element_.node_, "dblclick", function(evt) { GroundOverlayEX_imageDoubleClicked_(that, evt); }); }
		} else {
			if (this.imageListener4_ != null) { google.maps.event.removeListener(this.imageListener4_); this.imageListener4_ = null; }
		}
		if (this.shouldClickable_(4) || this.isEditing_) {
			this.qtyListeners_++; 
			if (this.imageListener5_ == null) { this.imageListener5_ = google.maps.event.addDomListener(this.display_element_.node_, "rightclick", function(evt) { GroundOverlayEX_imageRightClicked_(that, evt); }); }
		} else {
			if (this.imageListener5_ != null) { google.maps.event.removeListener(this.imageListener5_); this.imageListener5_ = null; }
		}
		if (this.shouldClickable_(8) || this.isEditing_) {
			this.qtyListeners_++; 
			if (this.imageListener6_ == null) { this.imageListener6_ = google.maps.event.addDomListener(this.display_element_.node_, "mouseover", function(evt) { GroundOverlayEX_imageMouseOver_(that, evt); }); }
		} else {
			if (this.imageListener6_ != null) { google.maps.event.removeListener(this.imageListener6_); this.imageListener6_ = null; }
		}
		if (this.shouldClickable_(16) || this.isEditing_) {
			this.qtyListeners_++; 
			if (this.imageListener7_ == null) { this.imageListener7_ = google.maps.event.addDomListener(this.display_element_.node_, "mouseout", function(evt) { GroundOverlayEX_imageMouseOut_(that, evt); }); }
		} else {
			if (this.imageListener7_ != null) { google.maps.event.removeListener(this.imageListener7_); this.imageListener7_ = null; }
		}
		if (this.isEditing_) {
			this.qtyListeners_ =  this.qtyListeners_ + 2;
			var el = null;
			for (var i in this.editing_elements_) { if (this.editing_elements_[i].id_ == "edt") { el = this.editing_elements_[i].node_; } }
			if (this.editListener1_ == null) { this.editListener1_ = google.maps.event.addDomListener(this.display_element_.node_, "mousemove", function(evt) { GroundOverlayEX_imageMouseMove_(that, evt); }); }
			if (this.editListener2_ == null && el != null) { this.editListener2_ = google.maps.event.addDomListener(el, "mousemove", function(evt) { GroundOverlayEX_imageMouseMove_(that, evt); }); }
			if (this.editListener3_ == null && el != null) { this.editListener3_ = google.maps.event.addDomListener(el, "mouseup", function(evt) { GroundOverlayEX_imageMouseUp_(that, evt); }); }
		} else {
			if (this.editListener1_ != null) { google.maps.event.removeListener(this.editListener1_); this.editListener1_ = null; }
			if (this.editListener2_ != null) { google.maps.event.removeListener(this.editListener2_); this.editListener2_ = null; }
			if (this.editListener3_ != null) { google.maps.event.removeListener(this.editListener2_); this.editListener3_ = null; }
		}
	} else {
		if (this.imageListener1_ != null) { google.maps.event.removeListener(this.imageListener1_); this.imageListener1_ = null; }
		if (this.imageListener2_ != null) { google.maps.event.removeListener(this.imageListener2_); this.imageListener2_ = null; }
		if (this.imageListener3_ != null) { google.maps.event.removeListener(this.imageListener3_); this.imageListener3_ = null; }
		if (this.imageListener4_ != null) { google.maps.event.removeListener(this.imageListener4_); this.imageListener4_ = null; }
		if (this.imageListener5_ != null) { google.maps.event.removeListener(this.imageListener5_); this.imageListener5_ = null; }
		if (this.imageListener6_ != null) { google.maps.event.removeListener(this.imageListener6_); this.imageListener6_ = null; }
		if (this.imageListener7_ != null) { google.maps.event.removeListener(this.imageListener7_); this.imageListener7_ = null; }
		if (this.editListener1_ != null) { google.maps.event.removeListener(this.editListener1_); this.editListener1_ = null; }
		if (this.editListener2_ != null) { google.maps.event.removeListener(this.editListener2_); this.editListener2_ = null; }
		if (this.editListener3_ != null) { google.maps.event.removeListener(this.editListener2_); this.editListener3_ = null; }
	}
}
GroundOverlayEX.prototype.removeAllListeners_ = function() {
	// need this to be recoverable, so set class properties to null
	this.qtyListeners_ = 0;
	if (this.mapListener1_ != null) { google.maps.event.removeListener(this.mapListener1_); this.mapListener1_ = null; }
	if (this.mapListener2_ != null) { google.maps.event.removeListener(this.mapListener2_); this.mapListener2_ = null; }
	if (this.mapListener3_ != null) { google.maps.event.removeListener(this.mapListener3_); this.mapListener3_ = null; }

	if (this.imageListener1_ != null) { google.maps.event.removeListener(this.imageListener1_); this.imageListener1_ = null; }
	if (this.imageListener2_ != null) { google.maps.event.removeListener(this.imageListener2_); this.imageListener2_ = null; }
	if (this.imageListener3_ != null) { google.maps.event.removeListener(this.imageListener3_); this.imageListener3_ = null; }
	if (this.imageListener4_ != null) { google.maps.event.removeListener(this.imageListener4_); this.imageListener4_ = null; }
	if (this.imageListener5_ != null) { google.maps.event.removeListener(this.imageListener5_); this.imageListener5_ = null; }
	if (this.imageListener6_ != null) { google.maps.event.removeListener(this.imageListener6_); this.imageListener6_ = null; }
	if (this.imageListener7_ != null) { google.maps.event.removeListener(this.imageListener7_); this.imageListener7_ = null; }

	if (this.editListener1_ != null) { google.maps.event.removeListener(this.editListener1_); this.editListener1_ = null; }
	if (this.editListener2_ != null) { google.maps.event.removeListener(this.editListener2_); this.editListener2_ = null; }
	if (this.editListener3_ != null) { google.maps.event.removeListener(this.editListener3_); this.editListener3_ = null; }
}
GroundOverlayEX.prototype.reassessRegion_ = function(pGOEXobj) {
console.log("GOEX.reassessRegion_ CALLED FROM TIMEOUT DUE TO CANVAS FAILURE");
	pGOEXobj.assessRegion_();
}
GroundOverlayEX.prototype.assessRegion_ = function() {
	// this is the main controller of the GOEX; it decides whether to load images, which image, and whether to display
	if (!this.mapAdded_) return;
	if (this.bounds_ == null && this.llq_ == null) return;

	if (this.isEditing_ || this.doEditing_) {
		// editing is active or desired; always use the passed parameter url
		var r = this.zoomArray_.whichIndexPerUrl(this.url_);
		if (this.imgsLoaded_[r] == 0) {
			// the needed image is not yet loaded; so load it which at callback will re-assess displaying it
			this.doLoadImageNumber_(r);
		} else if (this.imgsLoaded_[r] == 3) {
			// the needed image is already loaded; display it (if not already done so)
			var success = this.doDisplayImageNumber_(r);
			if (!success) { 
				// the displayed element failed; many times is due to a bad image, or perhaps insufficient crop information;
					// or for Firefox, their Canvas bugs during cropping
					if ((this.imgs_[r].width == 0 || this.imgs_[r].height == 0) && this.imgsLoaded_[r] >= 2) {
						// image is damaged; unload it then reload it
console.log("***FAILURE: GOEX.assessRegion_ "+this.id_+" "+this.displayText_+" inx="+r+" PREVIOUSLY LOADED EDITING IMAGE IS BAD!");	// ??!? temporary
						this.doUnloadImageNumber_(r);
						this.doLoadImageNumber_(r); 
					}
					// canvas errors are handled already by the display_element_ which includes an auto-call to this method;
					// missing cropping information will auto-call this method when new images are available
			} else {
				if (this.doEditing_ && !this.isEditing_) { this.setDoEditing(this.doEditing_); }
			}
		}
		return;
	}

	var mapBnds = this.map.getBounds();
	if (mapBnds.intersects(this.regionBounds_)) {
		// this GOEX is in-view (even partially, so choose which image should be shown
		var zoom = this.map.getZoom();
		var r = this.zoomArray_.whichIndexPerZoom(zoom);
		if (r >= 0) {
			// an image at this zoom level is to be displayed
			if (this.imgsLoaded_[r] == 0) {
				// the needed image is not yet loaded; so load it which at callback will re-assess displaying it
				this.doLoadImageNumber_(r);
			} else if (this.imgsLoaded_[r] == 3) {
				// the needed image is already loaded
				var success = this.doDisplayImageNumber_(r);
				if (!success) { 
					// the displayed element failed; many times is due to a bad image, or perhaps insufficient crop information;
					// or for Firefox, their Canvas bugs during cropping
					if ((this.imgs_[r].width == 0 || this.imgs_[r].height == 0) && this.imgsLoaded_[r] >= 2) {
						// image is damaged; unload it then reload it
console.log("***FAILURE: GOEX.assessRegion_ "+this.id_+" "+this.displayText_+" inx="+r+" PREVIOUSLY LOADED IMAGE IS BAD!");	// ??!? temporary
						this.doUnloadImageNumber_(r);
						this.doLoadImageNumber_(r); 
					}
					// canvas errors are handled already by the display_element_ which includes an auto-call to this method;
					// missing cropping information will auto-call this method when new images are available
				}
			}
		} else {
			// at this zoom level, nothing is to be displayed; however leave all images loaded and 
			// honor any pending manager load recommendation
			this.doDisplayImageNumber_(-1);
			if (this.managerRecommendedLoad_) {
				this.mgrRecommendLoadImage();
				this.managerRecommendedLoad_ = false;
			}
		}
	} else {
		// this GOEX is not in-view (not even partially); so remove the image from the map
		this.doDisplayImageNumber_(-1);

		// honor any pending manager load recommendation
		if (this.managerRecommendedLoad_) {
			this.mgrRecommendLoadImage();
			this.managerRecommendedLoad_ = false;
		}

		// unload all the images
		this.unloadAllImgs_();	// ??? need to account for a manager recommended download so we don't get into loops
	}
}
GroundOverlayEX.prototype.doLoadImageNumber_ = function(pIndex) {
	if (this.imgs_[pIndex] == null && this.imgsLoaded_[pIndex] == 0) {
		// image is not yet in-process of being loaded
		var img = document.createElement('img');
		this.imgs_[pIndex] = img;
		img.style.borderStyle = 'solid';
 		img.style.borderWidth = '0px';
		img.style.borderColor = 'Transparent';
 		img.style.position = 'absolute';
 		img.style.width = 'auto';
 		img.style.height = 'auto';
		img.parentGOEX = this;
		img.parentGOEX_index = pIndex;
		// remember inside the callbacks this = img object
		img.onerror = function(evt) { this.parentGOEX.imgFailedToLoad_(this, "error", evt); }
		img.onabort = function(evt) { this.parentGOEX.imgFailedToLoad_(this, "abort", evt); }
		img.onload = function(evt) { this.parentGOEX.imgFinishedLoading_(this, evt); }

		// now begin loading the image; the above callback will complete the process once the image has finally loaded
		this.imgsLoaded_[pIndex] = 1;
		if (this.imgsRetry_[pIndex] > 0) {
			var urlStr = this.zoomArray_.getUrl(pIndex) + "?fGxQr="+this.imgsRetry_[pIndex];
			img.src = urlStr;
		} else { img.src = this.zoomArray_.getUrl(pIndex); }
	}
}
GroundOverlayEX.prototype.imgFailedToLoad_ = function(pImg, pType, pEvt) {
	var index = pImg.parentGOEX_index;
	var img = this.imgs_[index];
	console.log("***DOWNLOAD-FAIL: GOEX.imgFailedToLoad_.on"+pType+" "+this.id_+" "+this.displayText_+" inx="+index+" retry="+this.imgsRetry_[index]+" LOAD ERROR FOR "+img.src);

	// eliminate this download attempt
	this.imgsLoaded_[index] = 0;
	img.parentGOEX = null;
	img.onerror = null;
	img.onabort = null;
	img.onload = null;
	delete img.parentGOEX;
	delete img.parentGOEX_index;
	img = null;
	this.imgs_[index] = null;

	// attempt only a couple of retries since we cannot tell if the failure is permanent (e.g. 404) or temporary
	if (this.imgsRetry_[index] < 2) {
		this.imgsRetry_[index]++;
		this.doLoadImageNumber_(index);
	}
}
GroundOverlayEX.prototype.imgFinishedLoading_ = function(pImg) {
	var index = pImg.parentGOEX_index;
	var img = this.imgs_[index];

	// this code gets invoked when the image has finally finished loading (and its original width and height are retrieved)
	if (img.width == 0 || img.height == 0) {
		// the URL has no width or height value; cannot proceed without these settings
		console.log("***DOWNLOAD-FAIL: GOEX.imgFinishedLoading_ "+this.id_+" "+this.displayText_+" inx="+index+" retry="+this.imgsRetry_[index]+" LOAD SUCCESSFUL BUT ZERO SIZE INFO FOR "+img.src);
		this.imgsLoaded_[index] = 0;
		this.imgs_[index].parentGOEX = null;
		img.onerror = null;
		img.onabort = null;
		img.onload = null;
		delete this.imgs_[index].parentGOEX;
		delete this.imgs_[index].parentGOEX_index;
		this.imgs_[index] = null;
		return;
	}

	// next see if this image contains information we've been waiting for
	if (this.origImgWidth_ <= 0 || this.origImgHeight_ <= 0) {
		if (img.src == this.url_) {
			// this is the passed parameter url, and OrigImgWidth and Height have not yet been determined,
			// so preserve this information for events and cropping
			this.origImgWidth_ = img.width;
			this.origImgHeight_ = img.height;
		}
	}
	if (this.cropping_) {
		if (this.cropBase_ == null) {
			if (img.src == this.url_) {
				// this is the image that supplies the cropping base information
				this.recordCropBase_();
			}
		}
	}

	// was this GOEX unloaded from the map while downloading of the image was in-process?
	// can happen with a fast-panning map
	if (!this.mapAdded_) {
		// yes, free up this image element
		this.imgsRetry_[index] = 0;
		this.imgsLoaded_[index] = 0;
		this.imgs_[index].parentGOEX = null;
		img.onerror = null;
		img.onabort = null;
		img.onload = null;
		delete this.imgs_[index].parentGOEX;
		delete this.imgs_[index].parentGOEX_index;
		this.imgs_[index] = null;
		return;
	}

	// image is going to be used or saved
	this.qtyImgsLoaded_++;
	this.memoryImgsLoaded_ += (img.width * img.height);
	this.imgsRetry_[index] = 0;

	// is the GOEX for non-cropped images?
	if (!this.cropping_) {
		// yes; perform the optional callback then assess the region for display of this new image
		this.imgsLoaded_[index] = 3;
		if (this.editingImageLoadedCallback_ != null) { 
			if (img.src == this.url_) {
				this.editingImageLoadedCallback_(this); 
				this.editingImageLoadedCallback_ = null; 
			}
		}
		this.assessRegion_();
		return;
	}

	// this GOEX is for cropped images
	if (this.cropBase_ == null) {
		// there is insufficient information to crop yet (likely the passed parameter url image is still downloading);
		// put the image on "hold"
		this.imgsLoaded_[index] = 2;
		return;
	}

	// sufficient cropping information is available now, also activate any images on-hold
	this.imgsLoaded_[index] = 3;
	for (var i in this.imgs_) {
		if (this.imgsLoaded_[i] == 2) this.imgsLoaded_[i] = 3;
	}
	// perform the optional callback then assess the region for display
	if (this.editingImageLoadedCallback_ != null) { 
		if (img.src == this.url_) {
			this.editingImageLoadedCallback_(this); 
			this.editingImageLoadedCallback_ = null; 
		}
	}
	this.assessRegion_();
}
GroundOverlayEX.prototype.unloadAllImgs_ = function() {
	// DANGER: ensure doDisplayImageNumber_(-1) has been called first
	for (var i in this.imgs_) {
		this.doUnloadImageNumber_(i);
	}
}
GroundOverlayEX.prototype.doUnloadImageNumber_ = function(pIndex) {
	// however do not unload it if it is actively being displayed or it is actively being downloaded
	if (pIndex != this.imgDisplayed_ && this.imgsLoaded_[pIndex] >= 2) {
		this.memoryImgsLoaded_ -= (this.imgs_[pIndex].width * this.imgs_[pIndex].height);
		this.qtyImgsLoaded_--;
		this.imgsRetry_[pIndex] = 0;
		this.imgsLoaded_[pIndex] = 0;
		var img = this.imgs_[pIndex];
		img.parentGOEX = null;
		img.onerror = null;
		img.onabort = null;
		img.onload = null;
		delete img.parentGOEX;
		delete img.parentGOEX_index;
		img = null;
		this.imgs_[pIndex] = null;
	}
	if (this.imgsRetry_[pIndex] > 0 && !this.mapAdded_) this.imgsRetry_[pIndex] = 0;
}
GroundOverlayEX.prototype.recordCropBase_ = function() {
	if (this.cropping_) {
		// initialize to "no cropping" settings
		var cropXleft_base = 0;
		var cropYtop_base = 0;
		var cropWidth_base = this.origImgWidth_;
		var cropHeight_base = this.origImgHeight_;

		// compose the cropBase from the initialization data
		if (this.cropFromLeft_ > 0) {
			if (this.cropFromLeft_ >= this.origImgWidth_) this.overCropped_ = true;
			cropXleft_base = this.cropFromLeft_; 
		}
		if (this.cropToWidth_ > 0) {
			if (this.cropToWidth_ > (this.origImgWidth_ - cropXleft_base)) this.overCropped_ = true;
			cropWidth_base = this.cropToWidth_; 
		} else { 
			cropWidth_base = this.origImgWidth_ - cropXleft_base; 
		}
		if (this.cropFromBottom_ > 0) { 
			if (this.cropFromBottom_ >= this.origImgHeight_) this.overCropped_ = true;
			cropHeight_base = this.origImgHeight_ - this.cropFromBottom_; 
		}
		if (this.cropToHeight_ > 0) { 
			cropYtop_base = (cropHeight_base - this.cropToHeight_); 
			if (this.cropToHeight_ > (this.origImgHeight_ - cropYtop_base)) this.overCropped_ = true;
			cropHeight_base = this.cropToHeight_; 
		}

		this.cropBase_ = null;
		this.cropBase_ = [0,0,0,0];
		this.cropBase_[0] = cropXleft_base;
		this.cropBase_[1] = cropYtop_base;
		this.cropBase_[2] = cropWidth_base;
		this.cropBase_[3] = cropHeight_base;
	}
}
GroundOverlayEX.prototype.doDisplayImageNumber_ = function(pIndex) {
	if (pIndex >= 0) {
		// an image is supposed to be displayed
		if (this.mapAdded_ && pIndex != this.imgDisplayed_) {
			// new image; change the display to the indicated image
			if (this.display_element_.isMapped_()) {
				// first remove any existing displayed image
				if (this.isEditing_) { this.setDoEditing(false); }
				this.display_element_.removeFromMap_();
				this.imgDisplayed_ = -1;
				this.emplaceProperListeners_(); 	// this will remove the prior this.display_element_ from all the listeners
			}

			var success = this.display_element_.addToMap_(this.imgs_[pIndex]);
			if (!success || !this.display_element_.isMapped_()) return false;
			
			// set the z-index properly, then activate proper listeners
			this.doZindex_();
			this.emplaceProperListeners_();

			// now force a draw
			this.imgDisplayed_ = pIndex;
			this.draw();
		}
	} else {
		// nothing is supposed to be displayed
		this.setDoEditing(false);
		if (this.display_element_.isMapped_()) {
			this.display_element_.removeFromMap_();
			this.imgDisplayed_ = -1;
		}
		this.emplaceProperListeners_();
	}
	return true;
}
GroundOverlayEX.prototype.doZindex_ = function() {
	// this gets called during the constructor options processing where this.display_element_ can be null
	if (this.display_element_ != null) {
		if (this.display_element_.isMapped_()) { this.display_element_.doZindex_(); }
		for (var i in this.editing_elements_) {
			this.editing_elements_[i].doZindex_();
		}
	}
}
GroundOverlayEX.prototype.setRotation_ = function(pDegCCW) {
	if (pDegCCW < -360) { this.rotate_ = 0; }
	else {
		if (pDegCCW < -180) { this.rotate_ = pDegCCW + 360; }
		else {
			if (pDegCCW > 360) { this.rotate_ = 0; }
			else {
				if (pDegCCW > 180) { this.rotate_ = pDegCCW - 360; }
				else {
					this.rotate_ = pDegCCW;
				}
			}
		}
	}

	// this gets called during the constructor options processing where this.display_element_ can be null
	if (this.display_element_ != null) {
		if (this.displayMode_ == "B" && this.display_element_.isMapped_()) {
			this.display_element_.setRotation_();
			this.computeLLQfromBounds_();
			this.recomputeRegionBounds_();
		}
	}
}
GroundOverlayEX.prototype.adjustForRotation_ = function(cX, cY, pX, pY) {
	// rotate the non-rotated pX,pY around cX,cY according to current rotate setting
	return this.doAdjustForRotation_(cX, cY, pX, pY, this.rotate_);
}
GroundOverlayEX.prototype.deadjustForRotation_ = function(cX, cY, pX, pY) {
	// de-rotate the rotated px,py around cX,cY according to the current rotate setting
	return this.doAdjustForRotation_(cX, cY, pX, pY, -this.rotate_);
}
GroundOverlayEX.prototype.doAdjustForRotation_ = function(cX, cY, pX, pY, pRotation) {
	// rotate or de-rotate a point
	if (pRotation == 0) { return [pX, pY]; }
        var a = pRotation * Math.PI / 180;

        // Subtract midpoints, so that midpoint is translated to origin and add it in the end again
        var xr = (pX - cX) * Math.cos(a) - (pY - cY) * Math.sin(a) + cX;
        var yr = (pX - cX) * Math.sin(a) + (pY - cY) * Math.cos(a) + cY;
    	return [xr, yr];
}
GroundOverlayEX.prototype.recomputeRegionBounds_ = function() {
	// the this.llq_ is available to create bounding boxes
	if (this.regionBoundsOrig_ == null) {
		// no regionBounds was set by the configuration, so the new bounds is just a simple recompute
		this.regionBounds_ = this.llq_.getBoundsBox();
	} else {
		// a regionBounds was defined by the configuration, so need to adapt that
		blLL = this.llq_.getBottomLeft();
		brLL = this.llq_.getBottomRight();
		trLL = this.llq_.getTopRight();
		tlLL = this.llq_.getTopLeft();
		this.regionBounds_ = this.regionBoundsOrig_.extend(blLL);
		this.regionBounds_ = this.regionBounds_.extend(brLL);
		this.regionBounds_ = this.regionBounds_.extend(trLL);
		this.regionBounds_ = this.regionBounds_.extend(tlLL);
		blLL = null;
		brLL = null;
		trLL = null;
		tlLL = null;
	}
}
GroundOverlayEX.prototype.computeLLQfromBounds_ = function() {
	// corners order is:  BL, BR, TR, TL
	var corners = this.display_element_.getCornersXY_();
	var overlayProjection = this.getProjection();

	var gmpoint = new google.maps.Point(corners[0][0], corners[0][1]);
 	var blLatlng = overlayProjection.fromDivPixelToLatLng(gmpoint);
	gmpoint = null;

	var gmpoint = new google.maps.Point(corners[1][0], corners[1][1]);
 	var brLatlng = overlayProjection.fromDivPixelToLatLng(gmpoint);
	gmpoint = null;

	gmpoint = new google.maps.Point(corners[2][0], corners[2][1]);
 	var trLatlng = overlayProjection.fromDivPixelToLatLng(gmpoint);
	gmpoint = null;

	gmpoint = new google.maps.Point(corners[3][0], corners[3][1]);
 	var tlLatlng = overlayProjection.fromDivPixelToLatLng(gmpoint);
	gmpoint = null;

	if (this.llq_ != null) this.llq_.destroy();
	this.llq_ = null;
	this.llq_ = new LatLngQuad(blLatlng, brLatlng, trLatlng, tlLatlng);
	this.llqType_ = "R";	
}
GroundOverlayEX.prototype.getMapDivSize_ = function() {
	var node = this.map.getDiv();
	return [node.clientWidth, node.clientHeight];
}
GroundOverlayEX.prototype.getCenterOfMapDiv_ = function() {
	var node = this.map.getDiv();
	var centerX = (node.offsetLeft + node.clientLeft) + Math.round(node.clientWidth / 2);
	var centerY = (node.offsetTop + node.clientTop) + Math.round(node.clientHeight / 2);
	return [centerX, centerY];
}

GroundOverlayEX.prototype.shouldClickable_ = function(pEventNumber) {
	// this.clickableEvents_: 1=click, 2=dblclick, 4=rightclick, 8=mouseover, 16=mouseout, 32=mousedown, 64=mouseup
	if (this.clickable_ && this.map != null) {
		if (this.map.getZoom() >= this.clickableAtZoom_) {
			var b = this.clickableEvents_ & pEventNumber;
			if (b != 0)  return true;
		}
	}
	return false;
}
GroundOverlayEX.prototype.getEventInfo_ = function(pMouseEvent) {
	var retInfo = [0,0,0,0];
	retInfo[0] = -1;
	retInfo[1] = -1;

	// get the point-of-click on the image; in both cases below, the click coordinates *includes* borders (and are therefore w/r/t offsetLeft, offsetTop, offsetWidth, offsetHeight)
	var imgX, imgY;
	if (pMouseEvent.offsetX == null ) { 	// Firefox
   		imgX = pMouseEvent.layerX;
   		imgY = pMouseEvent.layerY;
	} else {                       // Other browsers
  		imgX = pMouseEvent.offsetX;
   		imgY = pMouseEvent.offsetY;
	}

	// remove the border positioning
	deNode = this.display_element_.node_;
	imgX -= deNode.clientLeft;
	imgY -= deNode.clientTop;

	if (imgX >= 0 && imgY >= 0) {
		if (imgX <= deNode.clientWidth && imgY <= deNode.clientHeight) {
			if (this.zoomArray_.length() > 1) {	
				if (this.display_element_.isMapped_() && this.origImgWidth_ > 0 && this.origImgHeight_ > 0) {
					retInfo[0] = Math.round(imgX * (this.origImgWidth_ / this.display_element_.node_.width));
					retInfo[1] = Math.round(imgY * (this.origImgHeight_ / this.display_element_.node_.height));
				}
			} else {
				retInfo[0] = imgX;
				retInfo[1] = imgY;
			}
		}
	}

	// need to use ContainerPixel in this case since PageX and PageY are in the context of the entire page, not just the Map Div
	var overlayProjection = this.getProjection();
	var screenPoint = new google.maps.Point(pMouseEvent.pageX, pMouseEvent.pageY);
	var pointLatLon = overlayProjection.fromContainerPixelToLatLng(screenPoint);
	retInfo[2] = pointLatLon.lat();
	retInfo[3] = pointLatLon.lng();
	return retInfo;
}
GroundOverlayEX.prototype.doQuadrilateralTransform_ = function(pNode, pSrcLeftTop, pSrcSize, pDestCorners) {
	// see: http://codepen.io/fta/pen/ifnqH/
	// see: http://bl.ocks.org/mbostock/10571478
	// see: http://quabr.com/27209058/perspective-transformation-only-working-on-svg-tag-and-not-g-or-image

	// normalize the original position to the left,top of the original position
	// from and to order: TL, BL, TR, BR
	// this gets called alot, and creates alot of array objects, so be explicit about garbage collection
	// ??? further optimization: get rid of from and to intermediate arrays
	var i;
	var from = [];
	from.push({ x: 0, y: 0});
	from.push({ x: 0, y: pSrcSize[1]});
	from.push({ x: pSrcSize[0], y: 0});
	from.push({ x: pSrcSize[0], y: pSrcSize[1]});

	// normalize the desired position to the left,top of the original position
	var to= [];
	to.push({ x: pDestCorners[3][0] - pSrcLeftTop[0], y: pDestCorners[3][1] - pSrcLeftTop[1]});
	to.push({ x: pDestCorners[0][0] - pSrcLeftTop[0], y: pDestCorners[0][1] - pSrcLeftTop[1]});
	to.push({ x: pDestCorners[2][0] - pSrcLeftTop[0], y: pDestCorners[2][1] - pSrcLeftTop[1]});
	to.push({ x: pDestCorners[1][0] - pSrcLeftTop[0], y: pDestCorners[1][1] - pSrcLeftTop[1]});

	// construct A and b in preparation for the numeric.solve function
	var A = [];
	for (i = 0; i < 4; i++) {
      		A.push([from[i].x, from[i].y, 1, 0, 0, 0, -from[i].x * to[i].x, -from[i].y * to[i].x]);
     		A.push([0, 0, 0, from[i].x, from[i].y, 1, -from[i].x * to[i].y, -from[i].y * to[i].y]);
		from[i] = null;
    	}
	from = null;

	var b = [];
    	for (i = 0; i < 4; i++) {
      		b.push(to[i].x);
      		b.push(to[i].y);
		to[i] = null;
    	}
	to = null;

	// compute the transform parameters
	var h = numeric.solve(A, b);
	for (i = 0; i < 4; i++) { A[i] = null; }
	A = null;
	b = null;

	// reorder the return results into CSS style matrix3d order
	var H = [ h[0], h[3], 0, h[6], h[1], h[4], 0, h[7], 0, 0, 1, 0, h[2], h[5], 0, 1 ];
	h = null;
	var ts = "matrix3d(" + H.join(", ") + ")";
	H = null;
			  
	pNode.style["-webkit-transform"] = ts;	  
	pNode.style["-ms-transform"] = ts;
	pNode.style["-o-transform"] = ts;
	pNode.style.transform = ts;
}

// the following cannot be class methods, and cannot call data from any classes
function GOEX_computeIntersectTwoLines_(pL1endpoints, pL2endpoints) {
	// passed line endpoints: [0],[1] = top-endpoint x,y & [2],[3] = bottom-endpoint x,y
	// this formula calculates the intersection of two line segments that are absolutely known to intersect (such as for diagonals and bimedians)
	// this was adapted from: https://social.msdn.microsoft.com/Forums/en-US/4eb3423e-eb81-4977-8ce5-5a568d53fd9b/get-the-intersection-point-of-two-lines
	// another resource: https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect

	var theResults = [0,0];
	var dx1 = pL1endpoints[0] - pL1endpoints[2];	// line1 delta-x = L1Tx - L1Bx
	var dy1 = pL1endpoints[1] - pL1endpoints[3];	// line1 delta-y = L1Ty - L1By
	var dx2 = pL2endpoints[0] - pL2endpoints[2];	// line2 delta-x = L2Tx - L2Bx
	var dy2 = pL2endpoints[1] - pL2endpoints[3];	// line2 delta-y = L2Ty - L2By

			// ((L2By - L1By)*dx1*dx2 + dy1*dx2*L1Bx - dy2*dx1*L2Bx) / (dy1*dx2 - dy2*dx1)
	theResults[0] = ((pL2endpoints[3] - pL1endpoints[3])*dx1*dx2 + dy1*dx2*pL1endpoints[2] - dy2*dx1*pL2endpoints[2]) / (dy1*dx2 - dy2*dx1);
			// L1By + ((dy1/dx1) * (theResults[0] - L1Bx))
	theResults[1] = pL1endpoints[3] + ((dy1 / dx1) * (theResults[0] - pL1endpoints[2]));	
	return theResults;
}

////////////////////////
// Event Handlers
// private methods
////////////////////////

// for the following listener callback functions:
//   this = DOM root window
//   GOobj = GroundOverlayEX
//   evt = undefined
function GroundOverlayEX_mapDrag_(GOobj) {
	if (GOobj.clickable_) { this.clickStarted_ = false; }
	if (GOobj.display_element_.isMapped_() && GOobj.displayMode_ == "Q") {
		// these three lines are a kludge to force the browser to redraw the displayed element 
		// to fix the fact that transform does not render portions that may be outside the parent map window
		//GOobj.display_element_.node_.style.display = "none";
		//var height = GOobj.display_element_.node_.offsetHeight;
		//GOobj.display_element_.node_.style.display = "";
	}
}
function GroundOverlayEX_mapZoomChanged_(GOobj) {
	GOobj.emplaceProperListeners_();
}
function GroundOverlayEX_mapBoundsChanged_(GOobj) {
	// note a zoom change also creates a mapBoundsChange
	GOobj.assessRegion_();
}

// for the following listener callback functions:
//   this = DOM root window
//   GOobj = GroundOverlayEX
//   evt = DOM MouseEvent: layer* (works properly for Firefox only) is point within the displayed element's non-rotated/non-transformed coord space;
//			   offset* (all but Firefox) is point within the displayed element's non-rotated/non-transformed coord space;
//			   client* is point within the currently DOM top level page viewport (which could be same as page when no-scrolling or scrolled-to-top);
//			   page* is point within the entire DOM top level page coord space (including scrolled-off areas); 
//			   screen* is within the extended-monitor screen coord space
function GroundOverlayEX_imageClicked_(GOobj, evt) {
	if (GOobj.shouldClickable_(1) && this.clickStarted_) { 
		var info = GOobj.getEventInfo_(evt); 
		google.maps.event.trigger(GOobj, "click", evt, GOobj, info[0], info[1], info[2], info[3]); 
		if (GOobj.manager_ != null) { google.maps.event.trigger(GOobj.manager_, "click", evt, GOobj, info[0], info[1], info[2], info[3]); }
	}
}
function GroundOverlayEX_imageDoubleClicked_(GOobj, evt) {
	if (GOobj.shouldClickable_(2)) {
		var info = GOobj.getEventInfo_(evt);
		google.maps.event.trigger(GOobj, "dblclick", evt, GOobj, info[0], info[1], info[2], info[3]);
		if (GOobj.manager_ != null) { google.maps.event.trigger(GOobj.manager_, "dblclick", evt, GOobj, info[0], info[1], info[2], info[3]); }
	}
}
function GroundOverlayEX_imageRightClicked_(GOobj, evt) {
	if (GOobj.shouldClickable_(4)) {
		var info = GOobj.getEventInfo_(evt);
		google.maps.event.trigger(GOobj, "rightclick", evt, GOobj, info[0], info[1], info[2], info[3]);
		if (GOobj.manager_ != null) { google.maps.event.trigger(GOobj.manager_, "rightclick", evt, GOobj, info[0], info[1], info[2], info[3]); }
	}
}
function GroundOverlayEX_imageMouseOver_(GOobj, evt) {
	// this happens only once when the clicked or non-clicked cursor first passes over the displayed element;
	// however when resizing or rotating, the cursor may pass over the bounds over and over
	if (GOobj.shouldClickable_(8)) {
		var info = GOobj.getEventInfo_(evt);
		google.maps.event.trigger(GOobj, "mouseover", evt, GOobj, info[0], info[1], info[2], info[3]);
		if (GOobj.manager_ != null) { google.maps.event.trigger(GOobj.manager_, "mouseover", evt, GOobj, info[0], info[1], info[2], info[3]); }
	}
	if (GOobj.isEditing_) { 
		if (GOobj.mousemoveState_ == 2) {
			// a mouseup event was missed	
			GroundOverlayEX_imageMouseUp_(GOobj, evt);
		} else if (GOobj.mousemoveState_ <= 1) {
			var edge = GOobj.isAtWhichEdgePoint_(evt);
			if (edge > 0) { GOobj.display_element_.node_.style.cursor = GOobj.useWhichCursor_(evt, edge); }
			else { GOobj.display_element_.node_.style.cursor = 'move'; }
			GOobj.mousemoveState_ = 1;
		}
	}
}
function GroundOverlayEX_imageMouseOut_(GOobj, evt) {
	// this happens only once when the non-clicked or clicked cursor first leaves the displayed element;
	// however when resizing or rotating, the cursor may pass out of the bounds over and over
	if (GOobj.shouldClickable_(16)) {
		var info = GOobj.getEventInfo_(evt);
		google.maps.event.trigger(GOobj, "mouseout", evt, GOobj, info[0], info[1], info[2], info[3]);
		if (GOobj.manager_ != null) { google.maps.event.trigger(GOobj.manager_, "mouseout", evt, GOobj, info[0], info[1], info[2], info[3]); }
	}
	if (GOobj.isEditing_) { 
		if (GOobj.mousemoveState_ == 2) {
			// a mouseup event was missed
			GroundOverlayEX_imageMouseUp_(GOobj, evt);
		} else if (GOobj.mousemoveState_ <= 1) {
			GOobj.display_element_.node_.style.cursor = 'default';
			GOobj.mousemoveState_ = 0;
		}
	}
}
function GroundOverlayEX_imageMouseDown_(GOobj, evt) {
	// this happens only once when the mouse button is pressed and held over the displayed element
	
	this.clickStarted_ = true;
	if (GOobj.shouldClickable_(32)) {
		var info = GOobj.getEventInfo_(evt);
		google.maps.event.trigger(GOobj, "mousedown", evt, GOobj, info[0], info[1], info[2], info[3]);
		if (GOobj.manager_ != null) { google.maps.event.trigger(GOobj.manager_, "mousedown", evt, GOobj, info[0], info[1], info[2], info[3]); }
	}
	if (GOobj.isEditing_) { 
		if (GOobj.mousemoveState_ <= 1) {
			evt.preventDefault();
			GOobj.mousemovePrevX_ = evt.pageX;
			GOobj.mousemovePrevY_ = evt.pageY;
			var edge = GOobj.isAtWhichEdgePoint_(evt);
			if (GOobj.displayMode_ == "Q") {
				// acceptable edits for a LLQ are drag and corner resizing only
				if (edge >= 5) {
					GOobj.mousemoveState_ = 5;				// LLQ resizing
					GOobj.mousemoveHandle_ = edge;
				} else {
					GOobj.mousemoveState_ = 2;				// dragging
				}
			} else {
				// acceptable edits for a LLB are all
				if (edge >= 5 && !evt.shiftKey && !GOobj.editingForbidNonrect_) {
					// non-rectangular resizing a corner
					GOobj.mousemoveState_ = 5;				// convert to LLQ resizing
					GOobj.mousemoveHandle_ = edge;
				} else if (edge > 0) {
					// resizing an edge or rectangular corner
					GOobj.mousemoveState_ = 3;
					if (evt.shiftKey) { GOobj.mousemoveHandle_ = -edge; }	// forced proportional resizing
					else { GOobj.mousemoveHandle_ = edge; }			// non-proportional resizing
				} else {
					// not at edge
					if (evt.shiftKey) { GOobj.mousemoveState_ = 4; }	// rotating
					else { GOobj.mousemoveState_ = 2; }			// dragging
				}
			}
		}
	}
}
function GroundOverlayEX_imageMouseUp_(GOobj, evt) {
	// this happens only once when the mouse button is resleased when held over the displayed element;
	// note that this means the cursor is still "floating" over the displayed element
	
	if (GOobj.shouldClickable_(64)) {
		var info = GOobj.getEventInfo_(evt);
		google.maps.event.trigger(GOobj, "mouseup", evt, GOobj, info[0], info[1], info[2], info[3]);
		if (GOobj.manager_ != null) { google.maps.event.trigger(GOobj.manager_, "mouseup", evt, GOobj, info[0], info[1], info[2], info[3]); }
	}
	if (GOobj.isEditing_) { 
		evt.preventDefault();
		if (GOobj.mousemoveState_ == 5) {
			// LLQ-mode corners move was completed
			GOobj.displayMode_ = "Q";
			GOobj.bounds_ = null;
			GOobj.editingRecomputeAllGeoLocation_()
			GOobj.emplaceProperListeners_();
		} else if (GOobj.mousemoveState_ > 1) {
			// comption of all other edits
			GOobj.editingRecomputeAllGeoLocation_();
		}
		GOobj.mousemoveState_ = 1;
		GOobj.mousemovePrevX_ = 0;
		GOobj.mousemovePrevY_ = 0;
		GOobj.mousemoveHandle_ = 0;
	}
	if (evt.button == 2) {
		// was a right click
		if (GOobj.editable_ && evt.ctrlKey) { 
			// toggle editing or not editing
			evt.preventDefault();
			evt.stopPropagation();
			GOobj.setDoEditing(!GOobj.doEditing_);
		} else if (GOobj.isEditing_ && evt.altKey) {
			// revert image
			evt.preventDefault();
			GOobj.editingDoRevertImage();
		} else {
			if (GOobj.clickable_ && !GOobj.isEditing_) {
				var info = GOobj.getEventInfo_(evt);
				google.maps.event.trigger(GOobj, "rightclick", evt, GOobj, info[0], info[1], info[2], info[3]); 
				if (GOobj.manager_ != null) { google.maps.event.trigger(GOobj.manager_, "rightclick", evt, GOobj, info[0], info[1], info[2], info[3]); }
			}
		}
	}
}
function GroundOverlayEX_imageMouseMove_(GOobj, evt) {
	// this happens continuously when the mouse is over the displayed element (mouse button pressed or not pressed)
	if (!GOobj.isEditing_) return;
	if (GOobj.mousemoveState_ > 0) {
		evt.preventDefault();
		switch (GOobj.mousemoveState_) {
		case 1:
			// non-mouse-button-pressed mouseover
			var edge = GOobj.isAtWhichEdgePoint_(evt);
			if (edge > 0) { GOobj.display_element_.node_.style.cursor = GOobj.useWhichCursor_(evt, edge); }
			else { GOobj.display_element_.node_.style.cursor = 'move'; }
			break;
		case 2:
			// drag entire image
			if (evt.buttons == 0) {
				// a mouseup event was missed
				GroundOverlayEX_imageMouseUp_(GOobj, evt);
			} else {
				evt.preventDefault();
				var deltaX = Math.round(evt.pageX - GOobj.mousemovePrevX_);
				var deltaY = Math.round(evt.pageY - GOobj.mousemovePrevY_);
				var nonborderedLeftTop = GOobj.display_element_.getBoundsLeftTopXY_();
				nonborderedLeftTop[0] += deltaX;
				nonborderedLeftTop[1] += deltaY;

				// move the image and the corners
				GOobj.display_element_.adjustDragging_(deltaX, deltaY, nonborderedLeftTop[0], nonborderedLeftTop[1]);

				if (GOobj.displayMode_ == "Q") {
					// these three lines are a kludge to force a DOM redraw to fix the fact that transform does not render portions that may be outside the map window
					GOobj.display_element_.node_.style.display = "none";
					var height = GOobj.display_element_.node_.offsetHeight;
					GOobj.display_element_.node_.style.display = "";
				}
				
				// move all the editing elements (corners need to have been moved before calling)
				for (var i in GOobj.editing_elements_) {
					GOobj.editing_elements_[i].adjustDragging_(deltaX, deltaY, nonborderedLeftTop[0], nonborderedLeftTop[1]);
				}

				GOobj.mousemovePrevX_ = evt.pageX;
				GOobj.mousemovePrevY_ = evt.pageY;
				google.maps.event.trigger(GOobj, "position_changing", GOobj);
				if (GOobj.manager_ != null) google.maps.event.trigger(GOobj.manager_, "position_changing", GOobj);
			}
			break;
		case 3:
			// resize image edges or rectangular corners
			if (evt.buttons == 0) {
				// a mouseup event was missed
				GroundOverlayEX_imageMouseUp_(GOobj, evt);
			} else {
				var handle = Math.abs(GOobj.mousemoveHandle_);	
				var nonborderLeftTop = GOobj.display_element_.getBoundsLeftTopXY_();
				var nonborderSize = GOobj.display_element_.getBoundsSize_();
				ar_w2h = nonborderSize[0] / nonborderSize[1];

				var dx = Math.round(evt.pageX - GOobj.mousemovePrevX_);
				var dy = Math.round(evt.pageY - GOobj.mousemovePrevY_);
				if (GOobj.rotate_ != 0) {
					// image is rotated; need to re-calculate the dx and dy based upon the rotation
					var dist = Math.sqrt(dx*dx + dy*dy);
					var slope = Math.atan2(-dy, dx);	// atan2 assumes ascending +Y axis; however DOM uses -Y axis so need to correct
					var rotrad = GOobj.rotate_ * Math.PI / 180;
					if (GOobj.rotate_ < -90 || GOobj.rotate_ > 90) {
						if (handle >= 5) {
							handle += 2;
							if (handle > 8) handle -= 4;
						} else {
							handle += 2;
							if (handle > 4) handle -= 4;
						}
						var aslope = slope - rotrad + Math.PI;
					} else {
						var aslope = slope - rotrad;
					}
					dx = Math.round(Math.cos(aslope) * dist);
					dy = -Math.round(Math.sin(aslope) * dist);	// convert from +Y axis to -Y axis
				}

				// handles:	except +/- 10 of corner: 1= left edge, 2=bottom edge, 3=right edge, 4=top edge
				//		corners: 5=BL corner, 6=BR corner, 7=TR corner, 8=TL corner
				switch (handle) {
				case 1:		// left edge and width; increase in width is negative dx; but also must adjust "left" in the reverse direction
					nonborderSize[0] = nonborderSize[0] - dx;
					nonborderLeftTop[0] = nonborderLeftTop[0] + dx;
					if (GOobj.mousemoveHandle_ < 0) {
						dy = Math.round(dx / ar_w2h);
						nonborderSize[1] = nonborderSize[1] - dy;
						nonborderLeftTop[1] = nonborderLeftTop[1] + dy;
					}
					break;
				case 2:		//  bottom edge and height; increase in height is positive dy
					nonborderSize[1] = nonborderSize[1] + dy;
					if (GOobj.mousemoveHandle_ < 0) {
						dx = Math.round(dy * ar_w2h);
						nonborderSize[0] = nonborderSize[0] + dx;
					}
					break;
				case 3:		// right edge and width; increase in width is positive dx
					nonborderSize[0] = nonborderSize[0] + dx;
					if (GOobj.mousemoveHandle_ < 0) {
						dy = Math.round(dx / ar_w2h);
						nonborderSize[1] = nonborderSize[1] + dy;
					}
					break;
				case 4: 	// top edge and height; increase in height is negative dy; but also must adjust "top" in the reverse direction
					nonborderSize[1] = nonborderSize[1] - dy;
					nonborderLeftTop[1] = nonborderLeftTop[1] + dy;
					if (GOobj.mousemoveHandle_ < 0) {
						dx = Math.round(dy * ar_w2h);
						nonborderSize[0] = nonborderSize[0] - dx;
						nonborderLeftTop[0] = nonborderLeftTop[0] + dx;
					}
					break;
				case 5:		// bottom-left proportional; increase in width is negative dx; but also must adjust "left" in the reverse direction; increase in height is negative dy
					nonborderSize[0] = nonborderSize[0] - dx;
					nonborderLeftTop[0] = nonborderLeftTop[0] + dx;
					dy = Math.round(dx / ar_w2h);
					nonborderSize[1] = nonborderSize[1] - dy;
					break;
				case 6:		// bottom-right proportional; increase in width is positive dx; increase in height is positive dy
					nonborderSize[0] = nonborderSize[0] + dx;
					dy = Math.round(dx / ar_w2h);
					nonborderSize[1] = nonborderSize[1] + dy;
					break;
				case 7:		// top-right proportional;increase in width is positive dx; increase in height is positive dy; but also must adjust "top" in the reverse direction
					nonborderSize[0] = nonborderSize[0] + dx;
					dy = Math.round(dx / ar_w2h);
					nonborderSize[1] = nonborderSize[1] + dy;
					nonborderLeftTop[1] = nonborderLeftTop[1] - dy;
					break;
				case 8:		// top-left proportional; increase in width is negative dx; but also must adjust "left" in the reverse direction;
						// increase in height is negative dy; but also must adjust "top" in the reverse direction
					nonborderSize[0] = nonborderSize[0] - dx;
					nonborderLeftTop[0] = nonborderLeftTop[0] + dx;
					dy = Math.round(dx / ar_w2h);
					nonborderSize[1] = nonborderSize[1] - dy;
					nonborderLeftTop[1] = nonborderLeftTop[1] + dy;
					break;
				}

				GOobj.display_element_.adjustSizingLLB_(nonborderLeftTop[0], nonborderLeftTop[1], nonborderSize[0], nonborderSize[1])

				// move all the editing elements
				for (var i in GOobj.editing_elements_) {
					GOobj.editing_elements_[i].adjustSizingLLB_(nonborderLeftTop[0], nonborderLeftTop[1], nonborderSize[0], nonborderSize[1]);
				}
				GOobj.mousemovePrevX_ = evt.pageX;
				GOobj.mousemovePrevY_ = evt.pageY;
				google.maps.event.trigger(GOobj, "shape_changing", GOobj);
				if (GOobj.manager_ != null) google.maps.event.trigger(GOobj.manager_, "shape_changing", GOobj);
			}
			break;
		case 4:
			// rotate image only for LLB-mode
			if (evt.buttons == 0) {
				// a mouseup event was missed
				GroundOverlayEX_imageMouseUp_(GOobj, evt);
			} else {
				// remember evt.pageX,Y are in the context of entire browser window client area; 
				// GOobj.display_element_.getPositionXY_ is in the context of Map Div			
				var rect = GOobj.display_element_.node_.getBoundingClientRect();
				var centerX = rect.left + Math.round(rect.width / 2);
				var centerY = rect.top + Math.round(rect.height / 2);
				var prevMouseA = Math.atan2(GOobj.mousemovePrevY_ - centerY, GOobj.mousemovePrevX_ - centerX);
				var mouseA = Math.atan2(evt.pageY - centerY, evt.pageX - centerX);
				var dArad = mouseA - prevMouseA;
				var dAdeg = dArad * 180 / Math.PI;
				var newRot = GOobj.rotate_ - dAdeg;	// note that rotation for a GroundOverlay is CCW
				if (newRot > 180) newRot-=360;
				else if (newRot < -180) newRot+=360;
				GOobj.rotate_ = newRot;
				GOobj.display_element_.setRotation_();
				for (var i in GOobj.editing_elements_) { GOobj.editing_elements_[i].adjustRotationLLB_(); }
				GOobj.mousemovePrevX_ = evt.pageX;
				GOobj.mousemovePrevY_ = evt.pageY;
				google.maps.event.trigger(GOobj, "shape_changing", GOobj);
				if (GOobj.manager_ != null) google.maps.event.trigger(GOobj.manager_, "shape_changing", GOobj);
			}
			break;
		case 5:
			// non-rectangular resize image corners only for LLQ-mode (or will force-convert a LLB into a LLQ)
			if (evt.buttons == 0) {
				// a mouseup event was missed
				GroundOverlayEX_imageMouseUp_(GOobj, evt);
			} else {
				// handles:	except +/- 10 of corner: 1= left edge, 2=bottom edge, 3=right edge, 4=top edge
				//		corners: 5=BL corner, 6=BR corner, 7=TR corner, 8=TL corner
				var dx = Math.round(evt.pageX - GOobj.mousemovePrevX_);
				var dy = Math.round(evt.pageY - GOobj.mousemovePrevY_);
				GOobj.display_element_.resizeLLQbyDeltas_(Math.abs(GOobj.mousemoveHandle_), dx, dy);

				// resize appropriate editing elements
				var bb = GOobj.display_element_.getBoundsBox_();	// return is BL, TR, size				
				for (var i in GOobj.editing_elements_) {
					GOobj.editing_elements_[i].adjustSizingLLQ_(Math.abs(GOobj.mousemoveHandle_), dx, dy, bb);
				}
				GOobj.mousemovePrevX_ = evt.pageX;
				GOobj.mousemovePrevY_ = evt.pageY;
				google.maps.event.trigger(GOobj, "shape_changing", GOobj);
				if (GOobj.manager_ != null) google.maps.event.trigger(GOobj.manager_, "shape_changing", GOobj);
			}
			break;
		}
	}
}

////////////////////////
// extended capabilities for editing a GroundOverlayEX on-screen
// public methods
////////////////////////
GroundOverlayEX.prototype['getEditable'] = GroundOverlayEX.prototype.getEditable;
GroundOverlayEX.prototype.getEditable = function() {
	// returns whether editing is allowed or not allowed
	return this.editable_;
}
GroundOverlayEX.prototype['setEditable'] = GroundOverlayEX.prototype.setEditable;
GroundOverlayEX.prototype.setEditable = function(allowed) {
	// true=the GroundOverlayEX is allowed to be edited; actual editing is activated either by right-clicking on the image or programatically by calling this.setEditable();
	// false=do not allow editing and terminate any current editing
	if (allowed != 0 || allowed == true) { 
		this.editable_ = true;
	} else {
		this.setDoEditing(false);
		this.editable_ = false;
	}
	this.emplaceProperListeners_();
	return true;
}
GroundOverlayEX.prototype['setEditableForbidNonrect'] = GroundOverlayEX.prototype.setEditableForbidNonrect;
GroundOverlayEX.prototype.setEditableForbidNonrect = function(pForbid) {
	if (!this.editable_ || this.isEditing_) return false;
	this.editingForbidNonrect_ = pForbid;
	return true;
}
GroundOverlayEX.prototype['getDoEditing'] = GroundOverlayEX.prototype.getDoEditing;
GroundOverlayEX.prototype.getDoEditing = function() {
	// returns whether the GroundOverlayEX is currently being edited or not
	return this.isEditing_;
}
GroundOverlayEX.prototype['setDoEditing'] = GroundOverlayEX.prototype.setDoEditing;
GroundOverlayEX.prototype.setDoEditing = function(pAllowed) {
	// true=programatically activate editing of the GroundOverlayEx image; will be ignored if this.setEditable() has not been set to true prior to this call

	if (!this.editable_) { this.doEditing_ = false; return false; }
	// preserve the editing desired state for re-entrance purposes in case the passed parameter url is not yet loaded
	if (pAllowed != 0 || pAllowed == true) { this.doEditing_ = true; }
	else { this.doEditing_ = false; }
	if (this.display_element_ == null) { return false; }	// this does get called during constructor options evaluation
	if (!this.display_element_.isMapped_()) { return false; }	
	if (this.doEditing_ == this.isEditing_) { return true; }

	// is the passed parameter url image loaded?
	var r = this.zoomArray_.whichIndexPerUrl(this.url_);
	if (this.imgsLoaded_[r] == 0) {
		// no, must initiate loading and wait for it
		this.doLoadImageNumber_(r);
		return true;
	}

	var de = this.display_element_.node_;
	if (this.doEditing_) {
		// add the editing border and make appropriate adjustments to the this.display_element_
		this.display_element_.adjustForEditing_(true);

		// get info for the editing elements
		var nonborderLeftTop = this.display_element_.getBoundsLeftTopXY_();
		var nonborderSize = this.display_element_.getBoundsSize_();
		var nonborderBB = this.display_element_.getBoundsBox_();	// returns: BL, TR, size

		// release any prior array to garbage collection before allocating a new array for the editing elements
		var panes = this.getPanes();
		this.editing_elements_ = null;
		this.editing_elements_ = [];
		if (this.displayMode_ == "B") {
			// LatLngBounds-mode;
			// make a revert-to copy of the this.display_element_
			this.editing_revert_element_ = new GroundOverlayEX_element_imageLLB(this, null);
			this.editing_revert_element_.copy_(this.display_element_);

			// create various editing aids
			this.editing_elements_[0] = new GroundOverlayEX_element_bounds(this, nonborderSize[0], nonborderSize[1]);
			this.editing_elements_[1] = new GroundOverlayEX_element_region(this, nonborderBB[0][0], nonborderBB[1][1], nonborderBB[2][0], nonborderBB[2][1]);
			this.editing_elements_[2] = new GroundOverlayEX_element_editing(this, nonborderSize[0], nonborderSize[1]);
			this.editing_elements_[3] = new GroundOverlayEX_element_centerspot(this, nonborderSize[0], nonborderSize[1]);

			// need to re-order the overlays to ensure the Displayed Element remains on-top
			this.display_element_.removeFromMapLayer_();
			this.editing_elements_[0].addToMapLayer_(panes.overlayLayer);
			this.editing_elements_[1].addToMapLayer_(panes.overlayLayer);
			this.editing_elements_[2].addToMapLayer_(panes.overlayMouseTarget);
			this.display_element_.addToMapLayer_();
			this.editing_elements_[3].addToMapLayer_(panes.overlayMouseTarget);
				
			// clientLeft and clientTop will now be properly set for all elements after the appendChild
			for (var i in this.editing_elements_) {
				this.editing_elements_[i].adjustEditingLLB_(nonborderLeftTop[0], nonborderLeftTop[1]);
			}

		} else {
			// LatLngQuad-mode;
			// make a revert-to copy of the this.display_element_
			this.editing_revert_element_ = new GroundOverlayEX_element_imageLLQ(this, null);
			this.editing_revert_element_.copy_(this.display_element_);

			// create various editing aids
			this.editing_elements_[0] = new GroundOverlayEX_element_region(this, nonborderBB[0][0], nonborderBB[1][1], nonborderBB[2][0], nonborderBB[2][1]);
			this.editing_elements_[1] = new GroundOverlayEX_element_border(this, nonborderBB[2][0], nonborderBB[2][1]);
			this.editing_elements_[2] = new GroundOverlayEX_element_editing(this, nonborderBB[2][0], nonborderBB[2][1]);
			this.editing_elements_[3] = new GroundOverlayEX_element_centerspot(this, nonborderBB[2][0], nonborderBB[2][1]);
			this.editing_elements_[4] = new GroundOverlayEX_element_centerspotalt(this, nonborderBB[2][0], nonborderBB[2][1]);
			//this.editing_elements_[5] = new GroundOverlayEX_element_bounds(this, nonborderSize[0], nonborderSize[1]);

			// need to re-order the overlays to ensure the Displayed Element remains on-top
			this.display_element_.removeFromMapLayer_();
			//this.editing_elements_[5].addToMapLayer_(panes.overlayLayer);
			this.editing_elements_[0].addToMapLayer_(panes.overlayLayer);
			this.editing_elements_[1].addToMapLayer_(panes.overlayMouseTarget);
			this.editing_elements_[2].addToMapLayer_(panes.overlayMouseTarget);
			this.display_element_.addToMapLayer_();
			this.editing_elements_[3].addToMapLayer_(panes.overlayMouseTarget);
			this.editing_elements_[4].addToMapLayer_(panes.overlayMouseTarget);

			// clientLeft and clientTop will now be properly set for all elements after the appendChild
			for (var i in this.editing_elements_) {
				this.editing_elements_[i].adjustEditingLLQ_(nonborderBB);
			}
		}

		// zIndex changes must be done after this.isEditing_ is properly set
		this.isEditing_ = this.doEditing_;
		this.doZindex_();
		for (var i in this.editing_elements_) {
			this.editing_elements_[i].doZindex_();
		}
		google.maps.event.trigger(this, "editing_started", this);
		if (this.manager_ != null) google.maps.event.trigger(this.manager_, "editing_started", this);		
	} else {
		// eliminate all the editing elements
		for (var i in this.editing_elements_) {
			this.editing_elements_[i].destroy_();
			this.editing_elements_[i] = null;
		}
		this.editing_elements_ = null;
		if (this.editing_revert_element_ != null) {
			this.editing_revert_element_.destroy_();
			this.editing_revert_element_ = null;
		}

		// remove the editing border and make appropriate adjustments to the this.display_element_
		this.display_element_.adjustForEditing_(false);

		// zIndex changes must be done after this.isEditing_ is properly set
		this.isEditing_ = this.doEditing_;
		this.doZindex_();
		google.maps.event.trigger(this, "editing_done", this);
		if (this.manager_ != null) google.maps.event.trigger(this.manager_, "editing_done", this);
	}
	this.emplaceProperListeners_();	
	return true;
}
GroundOverlayEX.prototype['setEditingAidsVisible'] = GroundOverlayEX.prototype.setEditingAidsVisible;
GroundOverlayEX.prototype.setEditingAidsVisible = function(pAids, pVisible) {
	// pAids: 1=center, 2=diagonalcenter (LLQ), 4=bounds (LLB), 8=regionBounds
	if (!this.editable_ && !this.isEditing_) return false;
	for (var i in this.editing_elements_) {
		if (	(this.editing_elements_[i].id_ == "sp1" && (pAids & 1) != 0) ||
			(this.editing_elements_[i].id_ == "sp2" && (pAids & 2) != 0) ||
			(this.editing_elements_[i].id_ == "bnd" && (pAids & 4) != 0) ||
			(this.editing_elements_[i].id_ == "rgn" && (pAids & 8) != 0)) {
				this.editing_elements_[i].setVisible_(pVisible);
		}
	}
	return true;

}
GroundOverlayEX.prototype['getEditedIsCropped'] = GroundOverlayEX.prototype.getEditedIsCropped;
GroundOverlayEX.prototype.getEditedIsCropped = function() {
	// returns whether the GroundOverlayEX has been set for cropping of the image
	return this.cropping_;
}
GroundOverlayEX.prototype['getEditedImageInfo'] = GroundOverlayEX.prototype.getEditedImageInfo;
GroundOverlayEX.prototype.getEditedImageInfo = function() {
	return this.display_element_.getImageInfo_();
}
GroundOverlayEX.prototype['editingDoRevertImage'] = GroundOverlayEX.prototype.editingDoRevertImage;
GroundOverlayEX.prototype.editingDoRevertImage = function() {
	if (!this.isEditing_ || !this.display_element_.isMapped_()) return false;
	if (this.editing_revert_element_ == null) return false;

	if (this.displayMode_ == "B") {
		this.display_element_.restoreFrom_(this.editing_revert_element_);
		var nonborderSize = this.display_element_.getBoundsSize_();
		var nonborderLeftTop = this.display_element_.getBoundsLeftTopXY_();

		// make proper changes to editing div's if present
		for (var i in this.editing_elements_) {
			// always do size before position
			this.editing_elements_[i].adjustRevertLLB_(nonborderLeftTop[0], nonborderLeftTop[1], nonborderSize[0], nonborderSize[1]);
		}
	} else {
		this.display_element_.restoreFrom_(this.editing_revert_element_);

		// make proper changes to editing div's if present using the results of the corners just set
		var bb = this.display_element_.getBoundsBox_();		// returns BL, TR, size
		for (var i in this.editing_elements_) {
			this.editing_elements_[i].adjustRevertLLQ_(bb);
		}
	}
	google.maps.event.trigger(this, "editing_reverted", this);
	if (this.manager_ != null) google.maps.event.trigger(this.manager_, "editing_reverted", this);
}

////////////////////////
// extended capabilities for editing a GroundOverlayEX on-screen
// private methods
////////////////////////
GroundOverlayEX.prototype.isAtWhichEdgePoint_ = function(evt) {
	// handles:	except +/- 10 of corner: 1= left edge, 2=bottom edge, 3=right edge, 4=top edge
	//		corners: 5=BL corner, 6=BR corner, 7=TR corner, 8=TL corner
	// DANGER: for firefox only use layerX and layerY; for all other browsers, use offsetX and offsetY
	var edge = 0;
	var imgX, imgY;
	if (evt.offsetX == null ) { // Firefox
   		imgX = evt.layerX;
   		imgY = evt.layerY;
	} else {                       // Other browsers
  		imgX = evt.offsetX;
   		imgY = evt.offsetY;
	}

	de = this.display_element_.node_;
	if (imgX <= de.clientLeft + 4) {
		if (imgY <= de.clientTop + 20) edge = 8;
		else if (imgY >= de.offsetHeight - de.clientTop - 20) edge = 5;
		else edge = 1;
	}
	else if (imgX >= de.offsetWidth - de.clientLeft - 4) {
		if (imgY <= de.clientTop + 20) edge = 7;
		else if (imgY >= de.offsetHeight - de.clientTop - 20) edge = 6;
		else edge = 3;
	}
	else if (imgY <= de.clientTop + 4) {
		if (imgX <= de.clientLeft + 20) edge = 8;
		else if (imgX >= de.offsetWidth - de.clientTop - 20) edge = 7;
		else edge = 4;
	}
	else if (imgY >= de.offsetHeight - de.clientTop - 4) {
		if (imgX <= de.clientLeft + 20) edge = 5;
		else if (imgX >= de.offsetWidth - de.clientTop - 20) edge = 6;
		else edge = 2;
	}
	return edge;
}
GroundOverlayEX.prototype.useWhichCursor_ = function(evt, edge) {
	// handles:	except +/- 10 of corner: 1= left edge, 2=bottom edge, 3=right edge, 4=top edge
	//		corners: 5=BL corner, 6=BR corner, 7=TR corner, 8=TL corner
	// given the missing Firefox cursors, using "cell" for non-rectangular dragging
	if (this.displayMode_ == "Q") {
		if (edge >= 5) { return "cell"; }
		else { return "move"; }
	} else {
		if (edge >= 5 && !this.editingForbidNonrect_ && !evt.shiftKey) { return "cell"; }
		else {
			// GOEX_DIRECTIONS: clockwise from left edge
			if (edge >= 5) choice = ((edge - 5) * 2) + 1;
			else choice = (edge - 1) * 2;

			var rot = this.rotate_;
			if (rot < 0) rot = 360 + rot;
			if (rot > 180) rot -= 180;
			rot += 22.49;
			shift = Math.floor(rot / 45);
			choice += shift;
			if (choice > 7) choice -= 8;
			return GOEX_CURSORDIRECTIONS[choice];
		}
	}
	return "move";
}
GroundOverlayEX.prototype.editingRecomputeAllGeoLocation_ = function() {
	// need to update this.position, this.bounds_, this.regionBounds_, this.llq_, this.llqType_
	if (!this.isEditing_) return;
	var i, el, posX, posY;
	var overlayProjection = this.getProjection();

	// calculate the new position
	var center = this.display_element_.getPositionXY_();
	var gmpoint = new google.maps.Point(center[0], center[1]);
	this.position = null;
	this.position = overlayProjection.fromDivPixelToLatLng(gmpoint);

	if (this.displayMode_ == "B") {
		el = null;
		for (i in this.editing_elements_) { if (this.editing_elements_[i].id_ == "bnd") { el = this.editing_elements_[i]; } }
		if (el != null) {
			// calculate the latlngBounds (non-rotated rectangular); order is: SW, NE
			var nonborderLeftTop = el.getBoundsLeftTopXY_();
			var nonborderSize = el.getBoundsSize_();

			gmpoint = new google.maps.Point(nonborderLeftTop[0], nonborderLeftTop[1]+ nonborderSize[1]);	// W=left, S=bottom
 			var swLatlng = overlayProjection.fromDivPixelToLatLng(gmpoint);

			gmpoint = new google.maps.Point(nonborderLeftTop[0] + nonborderSize[0], nonborderLeftTop[1]);	// E=right, N=top
 			var neLatlng = overlayProjection.fromDivPixelToLatLng(gmpoint);

			this.bounds_ = null;
			this.bounds_ = new google.maps.LatLngBounds(swLatlng, neLatlng);

			// calculate the rectangular rotated latlngQuad
			this.computeLLQfromBounds_();
		}
	} else {
		// no bounds for a LLQ-mode
		this.bounds_ = null;

		// calculate the new latlngQuad from the new corners
		var corners = this.display_element_.getCornersXY_();
		var gmpoint = new google.maps.Point(corners[0][0],corners[0][1]);
 		var blLatlng = overlayProjection.fromDivPixelToLatLng(gmpoint);

		gmpoint = new google.maps.Point(corners[1][0], corners[1][1]);
 		var brLatlng = overlayProjection.fromDivPixelToLatLng(gmpoint);

		gmpoint = new google.maps.Point(corners[2][0], corners[2][1]);
 		var trLatlng = overlayProjection.fromDivPixelToLatLng(gmpoint);

		gmpoint = new google.maps.Point(corners[3][0], corners[3][1]);
 		var tlLatlng = overlayProjection.fromDivPixelToLatLng(gmpoint);

		if (this.llq_ != null) this.llq_.destroy();
		this.llq_ = null;
		this.llq_ = new LatLngQuad(blLatlng, brLatlng, trLatlng, tlLatlng);
		this.llqType_ = "N";
	}

	// calculate the regionBounds; order is: SW, NE
	el = null;
	for (i in this.editing_elements_) { if (this.editing_elements_[i].id_ == "rgn") { el = this.editing_elements_[i]; } }
	if (el != null) {
		var nonborderLeftTop = el.getBoundsLeftTopXY_();
		var nonborderSize = el.getBoundsSize_();

		gmpoint = new google.maps.Point(nonborderLeftTop[0], nonborderLeftTop[1]+ nonborderSize[1]);	// W=left, S=bottom
 		var swLatlng2 = overlayProjection.fromDivPixelToLatLng(gmpoint);

		gmpoint = new google.maps.Point(nonborderLeftTop[0] + nonborderSize[0], nonborderLeftTop[1]);	// E=right, N=top
 		var neLatlng2 = overlayProjection.fromDivPixelToLatLng(gmpoint);

		this.regionBounds_ = null;
		this.regionBounds_ = new google.maps.LatLngBounds(swLatlng2, neLatlng2);
	}
}

//////////////////////////////////////////////////////////////////////////////
// GOEX_element_* classes
//////////////////////////////////////////////////////////////////////////////
// display_element_ classes
//////////////////////////////////////////////////////////////////////////////
/**
 * @constructor
 */
window['GroundOverlayEX_element_imageLLB'] = GroundOverlayEX_element_imageLLB;
function GroundOverlayEX_element_imageLLB(pGOEX) {
	this.parentGOEX_ = pGOEX;
	this.id_ = "img";
	this.mode_ = "B";
	this.retried_ = 0;
	this.childAppended_ = false;

	this.img_ = null;
	this.canvas_ = null;
	this.node_ = null;
	this.nonborderLeft_ = 0;
	this.nonborderTop_ = 0;
	this.nonborderWidth_ = 0;
	this.nonborderHeight_ = 0;
	this.rot_ = 0;			// degrees clockwise
}
GroundOverlayEX_element_imageLLB.prototype.destroy_ = function() {
	this.removeFromMap_();

	this.parentGOEX_ = null;
	this.img_ = null;
	if (this.canvas_ != null) {
		this.canvas_.parentGOEX = null;
		delete this.canvas_.parentGOEX;
		delete this.canvas_.parentGOEX_index;
		this.canvas_ = null;
	}
	this.node_ = null;
}
GroundOverlayEX_element_imageLLB.prototype.addToMap_ = function(pImg) {
	// note: img.parentGOEX and img.parentGOEX_index are already available and will be accessable via this.node_
	if (pImg.width == 0 || pImg.height == 0) return false;	// something is wrong with the image
	if (this.node_ != null) return false;			// an image is already successfully added to the map; must .removeFromMap_() first

	// ensure the image's styles are proper for a LLB-mode image
	this.img_ = pImg;
	this.img_.style.borderStyle = 'solid';
 	this.img_.style.borderWidth = '0px';
	this.img_.style.borderColor = 'Transparent';
 	this.img_.style.position = 'absolute';
 	this.img_.style.width = 'auto';
 	this.img_.style.height = 'auto';

	if (!this.parentGOEX_.cropping_) {
		// not cropped, so setup the node and add the node to the map;
		// wait for the .doDrawLLB_() call to actually position and display
		this.node_ = this.img_;
		this.retried_ = 0;
		this.addToMapLayer_();

		// set the transform default for rotation
		this.node_.style["-webkit-transformOrigin"] = "50% 50%";	  
		this.node_.style["-ms-transformOrigin"] = "50% 50%";
		this.node_.style["-o-transformOrigin"] = "50% 50%";
		this.node_.style.transformOrigin = "50% 50%";
		return true;
	}

	// cropped image; do we have sufficient information to crop?
	if (this.parentGOEX_.cropBase_ == null) return false;	// nope

	// yes, prepare for the cropping
	this.img_.style.visibility = 'hidden';

	var cropXleft = Math.round(this.parentGOEX_.cropBase_[0] * this.img_.width / this.parentGOEX_.origImgWidth_);
	var cropYtop = Math.round(this.parentGOEX_.cropBase_[1] * this.img_.height / this.parentGOEX_.origImgHeight_);
	var cropWidth = Math.round(this.parentGOEX_.cropBase_[2] * this.img_.width / this.parentGOEX_.origImgWidth_);
	var cropHeight = Math.round(this.parentGOEX_.cropBase_[3] * this.img_.height / this.parentGOEX_.origImgHeight_);

	if (cropXleft >= this.img_.width || cropYtop >= this.img_.height) { this.parentGOEX_.overCropped_ = true; }
	if (cropWidth > (this.img_.width - cropXleft) || cropHeight > (this.img_.height - cropYtop)) { this.parentGOEX_.overCropped_ = true; }

	this.canvas_ = document.createElement('canvas');
	this.canvas_.width = cropWidth;
	this.canvas_.height = cropHeight;
	this.canvas_.style.borderStyle = 'solid';
 	this.canvas_.style.borderWidth = '0px';
	this.canvas_.style.borderColor = 'Transparent';
	this.canvas_.style.position = "absolute";
	this.canvas_.style.overflow = "visible";
	this.canvas_.parentGOEX = this.parentGOEX_;
	this.canvas_.parentGOEX_index = this.img_.parentGOEX_index;
	var ctx = this.canvas_.getContext('2d');

	// note: occasionally the canvas drawImage will fail with "NS_ERROR_NOT_AVAILABLE" because Firefox stupidly triggers on the OnLoad callback
	// BEFORE the image has actually downloaded.  A bug identified in 2010 and 5 years later never fixed.
	// see: https://bugzilla.mozilla.org/show_bug.cgi?id=574330
	// also see: https://stackoverflow.com/questions/18580844/firefox-drawimagevideo-fails-with-ns-error-not-available-component-is-not-av
	// err.name == "NS_ERROR_NOT_AVAILABLE"
	try {
		
		ctx.drawImage(this.img_, cropXleft, cropYtop, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
	} catch(err) {
		console.log("***DRAWING-FAIL: GOEX_EL_ImgLLB.addToMap_ ctx.drawImage() "+this.parentGOEX_.id_+" "+this.parentGOEX_.displayText_+" inx="+this.img_.parentGOEX_index+" cropparms="+this.img_.width+","+this.img_.height+"/"+cropXleft+","+cropYtop+"/"+cropWidth+","+cropHeight+" err="+err);
		ctx = null;
		if (this.retried_ < 2) {
			this.retried_++;
			var theGoex = this.parentGOEX_;
			setTimeout( function() {theGoex.reassessRegion_(theGoex)}, 150+Math.floor(Math.random()*200) );
		}	
		return false;
	}
	ctx = null;

	// so setup the node and add the node to the map;
	// wait for the .doDrawLLB_() call to actually position and display
	this.node_ = this.canvas_;
	this.retried_ = 0;
	this.addToMapLayer_();

	// set the transform default for rotation
	this.node_.style["-webkit-transformOrigin"] = "50% 50%";	  
	this.node_.style["-ms-transformOrigin"] = "50% 50%";
	this.node_.style["-o-transformOrigin"] = "50% 50%";
	this.node_.style.transformOrigin = "50% 50%";
	return true;
}
GroundOverlayEX_element_imageLLB.prototype.removeFromMap_ = function() {
	if (this.img_ == null) return false;	// already removed

	this.removeFromMapLayer_();

	this.img_ = null;
	if (this.canvas_ != null) {
		this.canvas_.parentGOEX = null;
		delete this.canvas_.parentGOEX;
		delete this.canvas_.parentGOEX_index;
		this.canvas_ = null;
	}
	this.node_ = null;
	return true;
}
GroundOverlayEX_element_imageLLB.prototype.isMapped_ = function() {
	if (this.img_ == null || this.node_ == null) return false;
	return true;
}
GroundOverlayEX_element_imageLLB.prototype.addToMapLayer_ = function() {
	if (!this.childAppended_) {
		// Add the node to the "overlayMouseTarget" pane of the map so we get mouse events
		var panes = this.parentGOEX_.getPanes();
		panes.overlayMouseTarget.appendChild(this.node_);
		this.node_.style.visibility = 'visible';
		this.childAppended_ = true;
		panes = null;
	}
}
GroundOverlayEX_element_imageLLB.prototype.removeFromMapLayer_ = function() {
	if (this.childAppended_) {
		this.node_.style.visibility = 'hidden';
		this.node_.parentNode.removeChild(this.node_);
		this.childAppended_ = false;
	}
}
GroundOverlayEX_element_imageLLB.prototype.doDrawLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	// this is called solely from the GroundOverlayEX.draw() method
	this.nonborderWidth_ = pNonBorderWidth;
	this.nonborderHeight_ = pNonBorderHeight;
	this.node_.style.width = pNonBorderWidth + "px";
	this.node_.style.height = pNonBorderHeight + "px";

	this.nonborderLeft_ = pNonBorderLeft;
	this.nonborderTop_ = pNonBorderTop;
	this.node_.style.left = (pNonBorderLeft - this.node_.clientLeft) + "px";
	this.node_.style.top = (pNonBorderTop - this.node_.clientLeft) + "px";
}
GroundOverlayEX_element_imageLLB.prototype.doDrawLLQ_ = function(pCorners) {
	// ignored for a LatLngBounds-mode element
	console.log("GOEX_el_imgLLB.doDrawLLQ_ SHOULD NOT HAVE BEEN CALLED");
}
GroundOverlayEX_element_imageLLB.prototype.setRotation_ = function() {
	this.rot_ = -(this.parentGOEX_.rotate_);	// browser expects degrees clockwise
	var rotStr = 'rotate(' + this.rot_ + 'deg)';
	this.node_.style["-webkit-transform"] = rotStr;	  
	this.node_.style["-ms-transform"] = rotStr;
	this.node_.style["-o-transform"] = rotStr;
	this.node_.style.transform = rotStr;
}
GroundOverlayEX_element_imageLLB.prototype.doOpacity_ = function() {
	this.node_.style.opacity = String(this.parentGOEX_.opacity_);
}
GroundOverlayEX_element_imageLLB.prototype.doZindex_ = function() {
	var z = this.parentGOEX_.getEffectiveZindex();
	this.node_.style.zIndex = String(z);
}
GroundOverlayEX_element_imageLLB.prototype.getBoundsLeftTopXY_ = function() {
	return [this.node_.offsetLeft + this.node_.clientLeft, this.node_.offsetTop + this.node_.clientTop];
}
GroundOverlayEX_element_imageLLB.prototype.getBoundsSize_ = function() {
	// return: width, height
	return [this.node_.clientWidth, this.node_.clientHeight];
}
GroundOverlayEX_element_imageLLB.prototype.getPositionXY_ = function() {
	// position is in the mapping context used to align this image and related editing elements
	var centerX = (this.node_.offsetLeft + this.node_.clientLeft) + Math.round(this.node_.clientWidth / 2);
	var centerY = (this.node_.offsetTop + this.node_.clientTop) + Math.round(this.node_.clientHeight / 2);
	return [centerX, centerY];
}
GroundOverlayEX_element_imageLLB.prototype.getCornersXY_ = function() {
	// calculate the rectangular rotated nonbordered corners; order is: BL, BR, TR, TL
	var theResults = [];
	var center = this.getPositionXY_();

	var posX = (this.node_.offsetLeft + this.node_.clientLeft);
	var posY = (this.node_.offsetTop + this.node_.clientTop)  + this.node_.clientHeight;
	var rpoint1 = this.parentGOEX_.adjustForRotation_(center[0], center[1], posX, posY);
	theResults[0] = rpoint1;
	
	posX = (this.node_.offsetLeft + this.node_.clientLeft) + this.node_.clientWidth;
	//posY = (this.node_.offsetTop + this.node_.clientTop)  + this.node_.clientHeight;
	var rpoint2 = this.parentGOEX_.adjustForRotation_(center[0], center[1], posX, posY);
	theResults[1] = rpoint2;

	//posX = (this.node_.offsetLeft + this.node_.clientLeft) + this.node_.clientWidth;
	posY = (this.node_.offsetTop + this.node_.clientTop);
	var rpoint3 = this.parentGOEX_.adjustForRotation_(center[0], center[1], posX, posY);
	theResults[2] = rpoint3;

	posX = (this.node_.offsetLeft + this.node_.clientLeft);
	//posY = (this.node_.offsetTop + this.node_.clientTop);
	var rpoint4 = this.parentGOEX_.adjustForRotation_(center[0], center[1], posX, posY);
	theResults[3] = rpoint4;
	center = null;

	return theResults;
}
GroundOverlayEX_element_imageLLB.prototype.getBoundsBox_ = function() {
	// calculate the boundsbox enclosing corners; return is x,y & x,y & width,height:  BL, TR, size
	var corners = this.getCornersXY_();
	
	var theResults = [];
	var point1 = [0,0];
	point1[0] = Math.min(corners[0][0], corners[1][0], corners[2][0], corners[3][0]);
	point1[1] = Math.max(corners[0][1], corners[1][1], corners[2][1], corners[3][1]);
	theResults[0] = point1;
	
	var point2 = [0,0];
	point2[0] = Math.max(corners[0][0], corners[1][0], corners[2][0], corners[3][0]);
	point2[1] = Math.min(corners[0][1], corners[1][1], corners[2][1], corners[3][1]);
	theResults[1] = point2;

	var size = [0,0];
	size[0] = Math.abs(point2[0] - point1[0]);
	size[1] = Math.abs(point2[1] - point1[1]);
	theResults[2] = size;

	return theResults;
}

// the following methods are used solely for editing, and need less memory optimization
GroundOverlayEX_element_imageLLB.prototype.copy_ = function(pGOEX_el_LLB) {
	if (pGOEX_el_LLB.img_ == null) return false;

	this.nonborderLeft_ = pGOEX_el_LLB.nonborderLeft_;
	this.nonborderTop_ = pGOEX_el_LLB.nonborderTop_;
	this.nonborderWidth_ = pGOEX_el_LLB.nonborderWidth_;
	this.nonborderHeight_ = pGOEX_el_LLB.nonborderHeight_;
	this.rot_ = pGOEX_el_LLB.rot_;
	return true;
}
GroundOverlayEX_element_imageLLB.prototype.restoreFrom_ = function(pGOEX_el_LLB) {
	if (this.img_ == null || this.node_ == null) return false;

	this.nonborderLeft_ = pGOEX_el_LLB.nonborderLeft_;
	this.nonborderTop_ = pGOEX_el_LLB.nonborderTop_;
	this.nonborderWidth_ = pGOEX_el_LLB.nonborderWidth_;
	this.nonborderHeight_ = pGOEX_el_LLB.nonborderHeight_;
	this.rot_ = pGOEX_el_LLB.rot_;

	this.node_.style.width = this.nonborderWidth_ + "px";
	this.node_.style.height = this.nonborderHeight_ + "px";
	this.node_.style.left = (this.nonborderLeft_ - this.node_.clientLeft) + "px";
	this.node_.style.top = (this.nonborderTop_ - this.node_.clientLeft) + "px";

	this.parentGOEX_.rotate_ = -this.rot_;		// GroundOverlayEX stores rotation as degrees counter-clockwise
	this.setRotation_();
	return true;
}
GroundOverlayEX_element_imageLLB.prototype.adjustForEditing_ = function(pEditingEnabled) {
	var nonborderLeft = this.node_.offsetLeft + this.node_.clientLeft;
	var nonborderTop = this.node_.offsetTop + this.node_.clientTop;

	if (pEditingEnabled) {
		this.node_.style.borderWidth = '2px';
		this.node_.style.borderColor = 'Fuchsia';
		this.node_.style.left = (nonborderLeft - 2) + 'px';	// de.clientTop and de.clientLeft will not have yet been reset
 		this.node_.style.top = (nonborderTop - 2) + 'px';
	} else {
		this.node_.style.borderWidth = '0px';
		this.node_.style.borderColor = 'Transparent';
		this.node_.style.left = nonborderLeft + 'px';
 		this.node_.style.top = nonborderTop + 'px';
	}
}
GroundOverlayEX_element_imageLLB.prototype.adjustSizingLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.nonborderWidth_ = pNonBorderWidth;
	this.nonborderHeight_ = pNonBorderHeight;
	this.node_.style.width = pNonBorderWidth + "px";
	this.node_.style.height = pNonBorderHeight + "px";

	this.nonborderLeft_ = pNonBorderLeft;
	this.nonborderTop_ = pNonBorderTop;
	this.node_.style.left = (pNonBorderLeft - this.node_.clientLeft) + "px";
	this.node_.style.top = (pNonBorderTop - this.node_.clientLeft) + "px";
}	
GroundOverlayEX_element_imageLLB.prototype.adjustDragging_ = function(pDeltaX, pDeltaY, pNonBorderLeft, pNonBorderTop) {
	this.nonborderLeft_ = pNonBorderLeft;
	this.nonborderTop_ = pNonBorderTop;
	this.node_.style.left = (pNonBorderLeft - this.node_.clientLeft) + "px";
	this.node_.style.top = (pNonBorderTop - this.node_.clientLeft) + "px";
}
GroundOverlayEX_element_imageLLB.prototype.resizeLLQbyDeltas_ = function(pHandle, pDeltaX, pDeltaY) {
	// this will indicate a need to convert the LLB to a LLQ
	// ???
}
GroundOverlayEX_element_imageLLB.prototype.getImageInfo_ = function() {
	// [0],[1]=Original width,height; [2],[3]=Cropped fromLeft,fromBottom;
	// [4],[5]=Cropped toWidth,toHeight; [6],[7]=Current width,height;
	// [8],[9]=Bounds left,top; [10],[11]=Bounds width,height;
	// [12],[13]=BoundsBox left,top; [14],[15]=BoundsBox width,height;
	// [16],[17]=Current center x,y; [18],[19]=Current diagonals x,y;
	// [20],[21]=Corner bottom-left X,y; [22],[23]=Corner bottom-right x,y;
	// [24],[25]=Corner top-right X,y; [26],[27]=Corner top-left x,y
	// [28] = rotation (deg clockwise)

	var corners = this.getCornersXY_();
	var bb = this.getBoundsBox_();	// return order: BL, TR, size

	var theResults = [];
	theResults[0] = this.parentGOEX_.origImgWidth_;
	theResults[1] = this.parentGOEX_.origImgHeight_;
	if (this.cropping_) {
		theResults[2] = this.parentGOEX_.cropBase_[0];
		theResults[3] = this.parentGOEX_.cropBase_[1];
		theResults[4] = this.parentGOEX_.cropBase_[2];
		theResults[5] = this.parentGOEX_.cropBase_[3];
	} else {
		theResults[2] = 0;
		theResults[3] = 0;
		theResults[4] = 0;
		theResults[5] = 0;
	}
	theResults[6] = this.node_.clientWidth;
	theResults[7] = this.node_.clientHeight;

	theResults[8] = (this.node_.offsetLeft + this.node_.clientLeft);
	theResults[9] = (this.node_.offsetTop + this.node_.clientTop);
	theResults[10] = this.node_.clientWidth;
	theResults[11] = this.node_.clientHeight;

	theResults[12] = bb[0][0];
	theResults[13] = bb[1][1];
	theResults[14] = bb[2][0];
	theResults[15] = bb[2][1];

	theResults[16] = corners[3][0] + Math.round(theResults[6] / 2);
	theResults[17] = corners[3][1] + Math.round(theResults[7] / 2);
	theResults[18] = theResults[12];
	theResults[19] = theResults[13];

	theResults[20] = corners[0][0];	// BL, BR, TR, TL order
	theResults[21] = corners[0][1];
	theResults[22] = corners[1][0];
	theResults[23] = corners[1][1];
	theResults[24] = corners[2][0];
	theResults[25] = corners[2][1];
	theResults[26] = corners[3][0];
	theResults[27] = corners[3][1];

	theResults[28] = this.rot_;	// clockwise
	return theResults;
}

/**
 * @constructor
 */
window['GroundOverlayEX_element_imageLLQ'] = GroundOverlayEX_element_imageLLQ;
function GroundOverlayEX_element_imageLLQ(pGOEX) {
	this.parentGOEX_ = pGOEX;
	this.id_ = "img";
	this.mode_ = "Q";
	this.retried_ = 0;
	this.childAppended_ = false;

	this.img_ = null;
	this.canvas_ = null;
	this.node_ = null;
	this.nonborderLeft_ = 0;
	this.nonborderTop_ = 0;
	this.nonborderWidth_ = 0;
	this.nonborderHeight_ = 0;
	this.corners_ = null;	// all corners are nonbordered
}
GroundOverlayEX_element_imageLLQ.prototype.destroy_ = function() {
	this.removeFromMap_();

	this.parentGOEX_ = null;
	this.img_ = null;
	if (this.canvas_ != null) {
		this.canvas_.parentGOEX = null;
		delete this.canvas_.parentGOEX;
		delete this.canvas_.parentGOEX_index;
		this.canvas_ = null;
	}
	this.node_ = null;
	if (this.corners_ != null) {
		// explicitly remove the prior corners array object
		for (var i in this.corners_) { this.corners_[i] = null; }
		this.corners_ = null;
	}
}
GroundOverlayEX_element_imageLLQ.prototype.addToMap_ = function(pImg) {
	// note: img.parentGOEX and img.parentGOEX_index are already available and will be accessable via this.node_
	if (pImg.width == 0 || pImg.height == 0) return false;	// something is wrong with the image
	if (this.node_ != null) return false;			// an image is already added to the map; must .removeFromMap_() first

	// ensure the image's styles are proper for a LLB-mode image
	this.img_ = pImg;
	this.img_.style.borderStyle = 'solid';
 	this.img_.style.borderWidth = '0px';
	this.img_.style.borderColor = 'Transparent';
 	this.img_.style.position = 'absolute';
 	this.img_.style.width = 'auto';
 	this.img_.style.height = 'auto';

	// to account for persistent and longterm Firefox bugs in their matrix3d transform, need to add a transparent border to LLQ images
	if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) { this.img_.style.borderWidth = '1px'; }

	if (!this.parentGOEX_.cropping_) {
		// not cropped, so setup the node and add the node to the map;
		// wait for the .doDrawLLB_() call to actually position and display
		this.node_ = this.img_;
		this.retried_ = 0;
		this.addToMapLayer_();

		// store the initial size of the untransformed image
		this.nonborderWidth_ = this.node_.width;
		this.nonborderHeight_ = this.node_.height;

		// set the transform default for rotation
		this.node_.style["-webkit-transformOrigin"] = "0 0";	  
		this.node_.style["-ms-transformOrigin"] = "0 0";
		this.node_.style["-o-transformOrigin"] = "0 0";
		this.node_.style.transformOrigin = "0 0";
		return true;
	}

	// cropped image; do we have sufficient information to crop?
	if (this.parentGOEX_.cropBase_ == null) return false;	// nope

	// yes, prepare for the cropping
	this.img_.style.visibility = 'hidden';

	var cropXleft = Math.round(this.parentGOEX_.cropBase_[0] * this.img_.width / this.parentGOEX_.origImgWidth_);
	var cropYtop = Math.round(this.parentGOEX_.cropBase_[1] * this.img_.height / this.parentGOEX_.origImgHeight_);
	var cropWidth = Math.round(this.parentGOEX_.cropBase_[2] * this.img_.width / this.parentGOEX_.origImgWidth_);
	var cropHeight = Math.round(this.parentGOEX_.cropBase_[3] * this.img_.height / this.parentGOEX_.origImgHeight_);

	if (cropXleft >= this.img_.width || cropYtop >= this.img_.height) { this.parentGOEX_.overCropped_ = true; }
	if (cropWidth > (this.img_.width - cropXleft) || cropHeight > (this.img_.height - cropYtop)) { this.parentGOEX_.overCropped_ = true; }

	this.canvas_ = document.createElement('canvas');
	this.canvas_.width = cropWidth;
	this.canvas_.height = cropHeight;
	this.canvas_.style.borderStyle = 'solid';
 	this.canvas_.style.borderWidth = '0px';
	this.canvas_.style.borderColor = 'Transparent';
	this.canvas_.style.position = "absolute";
	this.canvas_.style.overflow = "visible";
	this.canvas_.parentGOEX = this.parentGOEX_;
	this.canvas_.parentGOEX_index = this.img_.parentGOEX_index;
	var ctx = this.canvas_.getContext('2d');

	// to account for persistent and longterm Firefox bugs in their matrix3d transform, need to add a transparent border to LLQ images
	if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) { this.canvas_.style.borderWidth = '1px'; }

	// note: occasionally the canvas drawImage will fail with "NS_ERROR_NOT_AVAILABLE" because Firefox stupidly triggers on the OnLoad callback
	// BEFORE the image has actually downloaded.  A bug identified in 2010 and 5 years later never fixed.
	// see: https://bugzilla.mozilla.org/show_bug.cgi?id=574330
	// also see: https://stackoverflow.com/questions/18580844/firefox-drawimagevideo-fails-with-ns-error-not-available-component-is-not-av
	// err.name == "NS_ERROR_NOT_AVAILABLE"
	try {
		
		ctx.drawImage(this.img_, cropXleft, cropYtop, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
	} catch(err) {
		console.log("***DRAWING-FAIL: GOEX_EL_ImgLLB.addToMap_ ctx.drawImage() "+this.parentGOEX_.id_+" "+this.parentGOEX_.displayText_+" inx="+this.img_.parentGOEX_index+" cropparms="+this.img_.width+","+this.img_.height+"/"+cropXleft+","+cropYtop+"/"+cropWidth+","+cropHeight+" err="+err);
		ctx = null;
		if (this.retried_ < 2) {
			this.retried_++;
			var theGoex = this.parentGOEX_;
			setTimeout( function() {theGoex.reassessRegion_(theGoex)}, 150+Math.floor(Math.random()*200) );
		}
		return false;
	}
	ctx = null;

	// so setup the node and add the node to the map;
	// wait for the .doDrawLLB_() call to actually position and display
	this.node_ = this.canvas_;
	this.retried_ = 0;
	this.addToMapLayer_();

	// store the initial size of the untransformed image
	this.nonborderWidth_ = this.node_.width;
	this.nonborderHeight_ = this.node_.height;

	// set the transform default for rotation
	this.node_.style["-webkit-transformOrigin"] = "0 0";	  
	this.node_.style["-ms-transformOrigin"] = "0 0";
	this.node_.style["-o-transformOrigin"] = "0 0";
	this.node_.style.transformOrigin = "0 0";
	return true;
}
GroundOverlayEX_element_imageLLQ.prototype.removeFromMap_ = function() {
	if (this.img_ == null) return false;	// already removed
		
	this.removeFromMapLayer_();

	this.img_ = null;	
	if (this.canvas_ != null) {
		this.canvas_.parentGOEX = null;
		delete this.canvas_.parentGOEX;
		delete this.canvas_.parentGOEX_index;
		this.canvas_ = null;
	}
	this.node_ = null;
	if (this.corners_ != null) {
		// explicitly remove the prior corners array object
		for (var i in this.corners_) { this.corners_[i] = null; }
		this.corners_ = null;
	}
	return true;
}
GroundOverlayEX_element_imageLLQ.prototype.isMapped_ = function() {
	if (this.img_ == null || this.node_ == null) return false;
	return true;
}
GroundOverlayEX_element_imageLLQ.prototype.addToMapLayer_ = function() {
	if (!this.childAppended_) {
		// Add the node to the "overlayMouseTarget" pane of the map so we get mouse events
		var panes = this.parentGOEX_.getPanes();
		panes.overlayMouseTarget.appendChild(this.node_);
		this.node_.style.visibility = 'visible';
		this.childAppended_ = true;
		panes = null;
	}
}
GroundOverlayEX_element_imageLLQ.prototype.removeFromMapLayer_ = function() {
	if (this.childAppended_) {
		this.node_.style.visibility = 'hidden';
		this.node_.parentNode.removeChild(this.node_);
		this.childAppended_ = false;
	}
}
GroundOverlayEX_element_imageLLQ.prototype.doDrawLLQ_ = function(pCorners) {
	// this is called solely from the GroundOverlayEX.draw() method
	// all corners are nonbordered, and must be in order:  BL, BR, TR, TL
	if (this.corners_ != null) {
		// explicitly remove the prior corners array object
		for (var i in this.corners_) { this.corners_[i] = null; }
		this.corners_ = null;
	}

	// retain the new corners object
	this.corners_ = pCorners;

	// in order to handle Firefox transform bugs for large images, first resize then move the source (non-transformed) 
	// node to the center of the map DIV
	this.doResetNodeSizePosition_();

	// draw the transformation
	this.prepDoQuadrilateralTransform_();
}
GroundOverlayEX_element_imageLLQ.prototype.doDrawLLB_ = function(pCorners) {
	// ignored for a LatLngQuad-mode element
	console.log("GOEX_el_imgLLQ.doDrawLLB_ SHOULD NOT HAVE BEEN CALLED");
}
GroundOverlayEX_element_imageLLQ.prototype.doOpacity_ = function() {
	this.node_.style.opacity = String(this.parentGOEX_.opacity_);
}
GroundOverlayEX_element_imageLLQ.prototype.doZindex_ = function() {
	var z = this.parentGOEX_.getEffectiveZindex();
	this.node_.style.zIndex = String(z);
}
GroundOverlayEX_element_imageLLQ.prototype.getBoundsLeftTopXY_ = function() {
	return [this.node_.offsetLeft + this.node_.clientLeft, this.node_.offsetTop + this.node_.clientTop];
}
GroundOverlayEX_element_imageLLQ.prototype.getBoundsSize_ = function() {
	// return: width, height
	return [this.node_.clientWidth, this.node_.clientHeight];
}
GroundOverlayEX_element_imageLLQ.prototype.getPositionXY_ = function() {
	// for a LatLngQuad, the position is the center of the bounding box of its corners
	var bb = this.getBoundsBox_();
	var centerX = bb[0][0] + Math.round(bb[2][0] / 2);
	var centerY = bb[1][1] + Math.round(bb[2][1] / 2);
	bb = null;
	return [centerX, centerY];
}
GroundOverlayEX_element_imageLLQ.prototype.getCornersXY_ = function() {
	// calculate the rectangular rotated corners; order is: BL, BR, TR, TL
	return this.corners_;
}
GroundOverlayEX_element_imageLLQ.prototype.getBoundsBox_ = function() {
	// calculate the boundsbox enclosing corners; return is x,y & x,y & width,height:  BL, TR, size
	var theResults = [];
	var point1 = [0,0];
	point1[0] = Math.min(this.corners_[0][0], this.corners_[1][0], this.corners_[2][0], this.corners_[3][0]);
	point1[1] = Math.max(this.corners_[0][1], this.corners_[1][1], this.corners_[2][1], this.corners_[3][1]);
	theResults[0] = point1;

	var point2 = [0,0];
	point2[0] = Math.max(this.corners_[0][0], this.corners_[1][0], this.corners_[2][0], this.corners_[3][0]);
	point2[1] = Math.min(this.corners_[0][1], this.corners_[1][1], this.corners_[2][1], this.corners_[3][1]);
	theResults[1] = point2;

	var size = [0,0];
	size[0] = Math.abs(point2[0] - point1[0]);
	size[1] = Math.abs(point2[1] - point1[1]);
	theResults[2] = size;
	
	return theResults;
}
GroundOverlayEX_element_imageLLQ.prototype.doResetNodeSizePosition_ = function() {
	// in order to handle Firefox transform bugs for large images, first resize then move the source (non-transformed) 
	// node to the center of the map DIV
	// this gets called everytime GOEX draw() gets called so be more explicit about garbage collection
	var mapSize = this.parentGOEX_.getMapDivSize_();
	//mapSize[0] =  Math.round(mapSize[0] * .75);
	//mapSize[1] =  Math.round(mapSize[1] * .75);

	/*if (this.node_.width > mapSize[0] || this.node_.height > mapSize[1] || 
	    this.nonborderWidth_ > mapSize[0] || this.nonborderHeight_ > mapSize[1]) {
		intWidth1 = mapSize[0];
		intHeight1 = Math.round(this.node_.height * (intWidth1 / this.node_.width));

		intHeight2 = mapSize[1];
		intWidth2 = Math.round(this.node_.width * (intHeight2 / this.node_.height));

		if (intHeight1 <= mapSize[1]) {
			this.nonborderWidth_ = intWidth1;
			this.nonborderHeight_ = intHeight1;
		} else {
			this.nonborderWidth_ = intWidth2;
			this.nonborderHeight_ = intHeight2;
		}
	}
	mapSize = null;
	this.node_.style.width = this.nonborderWidth_ + "px";
	this.node_.style.height = this.nonborderHeight_ + "px";*/

	var mapCenter = this.parentGOEX_.getCenterOfMapDiv_();
	this.nonborderLeft_ = mapCenter[0] - Math.round(this.node_.clientWidth / 2);
	this.nonborderTop_ = mapCenter[1] - Math.round(this.node_.clientHeight / 2);
	mapCenter = null;
	this.node_.style.left = (this.nonborderLeft_ - this.node_.clientLeft) + 'px';
 	this.node_.style.top = (this.nonborderTop_ - this.node_.clientTop) + 'px';
}

// the following methods are used solely for editing, and need less memory optimization
GroundOverlayEX_element_imageLLQ.prototype.copy_ = function(pGOEX_el_LLQ) {
	if (pGOEX_el_LLQ.img_ == null) return false;

	this.nonborderLeft_ = pGOEX_el_LLQ.nonborderLeft_;
	this.nonborderTop_ = pGOEX_el_LLQ.nonborderTop_;
	this.nonborderWidth_ = pGOEX_el_LLQ.nonborderWidth_;
	this.nonborderHeight_ = pGOEX_el_LLQ.nonborderHeight_;

	if (this.corners_ != null) {
		// explicitly remove the prior corners array object
		for (var i in this.corners_) { this.corners_[i] = null; }
		this.corners_ = null;
	}
	this.corners_ = [];
	for (var i in pGOEX_el_LLQ.corners_) {
		this.corners_[i] = pGOEX_el_LLQ.corners_[i].slice(0);
	}
	return true;
}
GroundOverlayEX_element_imageLLQ.prototype.restoreFrom_ = function(pGOEX_el_LLQ) {
	if (this.img_ == null || this.node_ == null) return false;

	this.nonborderLeft_ = pGOEX_el_LLQ.nonborderLeft_;
	this.nonborderTop_ = pGOEX_el_LLQ.nonborderTop_;
	this.nonborderWidth_ = pGOEX_el_LLQ.nonborderWidth_;
	this.nonborderHeight_ = pGOEX_el_LLQ.nonborderHeight_;

	if (this.corners_ != null) {
		// explicitly remove the prior corners array object
		for (var i in this.corners_) { this.corners_[i] = null; }
		this.corners_ = null;
	}
	this.corners_ = []; 
	for (var i in pGOEX_el_LLQ.corners_) {
		this.corners_[i] = pGOEX_el_LLQ.corners_[i].slice(0);
	}

	this.node_.style.width = this.nonborderWidth_ + "px";
	this.node_.style.height = this.nonborderHeight_ + "px";
	this.node_.style.left = (this.nonborderLeft_ - this.node_.clientLeft) + 'px';
 	this.node_.style.top = (this.nonborderTop_ - this.node_.clientTop) + 'px';

	// regardless of the restore, position the source node properly
	this.doResetNodeSizePosition_();

	// draw the transformation
	this.prepDoQuadrilateralTransform_();
	return true;
}
GroundOverlayEX_element_imageLLQ.prototype.adjustForEditing_ = function(pEditingEnabled) {
	// not required for a LLQ
}
GroundOverlayEX_element_imageLLQ.prototype.adjustSizingLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	// ignored for a LatLngQuad-mode element
	console.log("GOEX_el_imgLLQ.adjustSizingLLB_ SHOULD NOT HAVE BEEN CALLED");
}
GroundOverlayEX_element_imageLLQ.prototype.setRotation_ = function() {
	// ignored for a LatLngQuad-mode element
	console.log("GOEX_el_imgLLQ.setRotation_ SHOULD NOT HAVE BEEN CALLED");
}
GroundOverlayEX_element_imageLLQ.prototype.adjustDragging_ = function(pDeltaX, pDeltaY, pNonBorderLeft, pNonBorderTop) {
	// moving the underlying hidden image will move the transformed image
	this.nonborderLeft_ = pNonBorderLeft;
	this.nonborderTop_ = pNonBorderTop;
	this.node_.style.left = (pNonBorderLeft - this.node_.clientLeft) + "px";
	this.node_.style.top = (pNonBorderTop - this.node_.clientLeft) + "px";

	// also need to move all the corners
	for (var i=0; i<4; i++) {
		this.corners_[i][0] += pDeltaX;
		this.corners_[i][1] += pDeltaY;
	}
}
GroundOverlayEX_element_imageLLQ.prototype.resizeLLQbyDeltas_ = function(pHandle, pDeltaX, pDeltaY) {
	// handle codes: 5=BL, 6=BR, 7=TR, 8=TL
	switch (pHandle) {
	case 5:		// bottom left corner
		var BLpt = this.corners_[0];
		BLpt[0] = BLpt[0] + pDeltaX;
		BLpt[1] = BLpt[1] + pDeltaY;
		this.corners_[0] = BLpt;
		break;
	case 6:		// bottom right corner
		var BRpt = this.corners_[1];
		BRpt[0] = BRpt[0] + pDeltaX;
		BRpt[1] = BRpt[1] + pDeltaY;
		this.corners_[1] = BRpt;
		break;
	case 7:		// top right corner
		var TRpt = this.corners_[2];
		TRpt[0] = TRpt[0] + pDeltaX;
		TRpt[1] = TRpt[1] + pDeltaY;
		this.corners_[2] = TRpt;
		break;
	case 8:		// top left corner
		var TLpt = this.corners_[3];
		TLpt[0] = TLpt[0] + pDeltaX;
		TLpt[1] = TLpt[1] + pDeltaY;
		this.corners_[3] = TLpt;
		break;
	}
	this.prepDoQuadrilateralTransform_();
}
GroundOverlayEX_element_imageLLQ.prototype.getImageInfo_ = function() {
	// [0],[1]=Original width,height; [2],[3]=Cropped fromLeft,fromBottom;
	// [4],[5]=Cropped toWidth,toHeight; [6],[7]=Current width,height;
	// [8],[9]=Bounds left,top; [10],[11]=Bounds width,height;
	// [12],[13]=BoundsBox left,top; [14],[15]=BoundsBox width,height;
	// [16],[17]=Current center x,y; [18],[19]=Current diagonals x,y;
	// [20],[21]=Corner bottom-left X,y; [22],[23]=Corner bottom-right x,y;
	// [24],[25]=Corner top-right X,y; [26],[27]=Corner top-left x,y
	// [28] = effective/approximate rotation (deg clockwise)

	var bb = this.getBoundsBox_();	// return order: BL, TR, size

	var theResults = [];
	theResults[0] = this.parentGOEX_.origImgWidth_;
	theResults[1] = this.parentGOEX_.origImgHeight_;
	if (this.cropping_) {
		theResults[2] = this.parentGOEX_.cropBase_[0];
		theResults[3] = this.parentGOEX_.cropBase_[1];
		theResults[4] = this.parentGOEX_.cropBase_[2];
		theResults[5] = this.parentGOEX_.cropBase_[3];
	} else {
		theResults[2] = 0;
		theResults[3] = 0;
		theResults[4] = 0;
		theResults[5] = 0;
	}
	var stuff = this.computeSizeOfQuad_();
	theResults[6] = stuff[0];
	theResults[7] = stuff[1];

	theResults[8] = (this.node_.offsetLeft + this.node_.clientLeft);
	theResults[9] = (this.node_.offsetTop + this.node_.clientTop);
	theResults[10] = this.node_.clientWidth;
	theResults[11] = this.node_.clientHeight;

	theResults[12] = bb[0][0];
	theResults[13] = bb[1][1];
	theResults[14] = bb[2][0];
	theResults[15] = bb[2][1];

	stuff = this.computeCenterOfQuad_(0);	// bimedian method
	theResults[16] = stuff[0];
	theResults[17] = stuff[1];
	stuff = this.computeCenterOfQuad_(1);		// diagonals method
	theResults[18] = stuff[0];
	theResults[19] = stuff[1];

	theResults[20] = this.corners_[0][0];
	theResults[21] = this.corners_[0][1];
	theResults[22] = this.corners_[1][0];
	theResults[23] = this.corners_[1][1];
	theResults[24] = this.corners_[2][0];
	theResults[25] = this.corners_[2][1];
	theResults[26] = this.corners_[3][0];
	theResults[27] = this.corners_[3][1];

	theResults[28] = this.computeApproximateRotationCW_(theResults[16], theResults[17]);
	return theResults;
}
GroundOverlayEX_element_imageLLQ.prototype.prepDoQuadrilateralTransform_ = function() {
	// requires that this.corners_ be properly set with x,y points of the BL, BR, TR, TL corners;
	// get the original (non-transformed) position of the img or canvas, which should never have borders even during editing
	// this gets called fairly often, so be explicit about garbage collection
	var srcSize = [this.node_.clientWidth,  this.node_.clientHeight];
	var srcLeftTop = [(this.node_.offsetLeft + this.node_.clientLeft), (this.node_.offsetTop + this.node_.clientTop)];
	
	// perform the quad transform
	this.parentGOEX_.doQuadrilateralTransform_(this.node_, srcLeftTop, srcSize, this.corners_);
	srcSize = null;
	srcLeftTop = null;
}
GroundOverlayEX_element_imageLLQ.prototype.computeSizeOfQuad_ = function() {
	// width (TL to TR, BL to BR)
	var dx = this.corners_[3][0] - this.corners_[2][0];
	var dy = this.corners_[3][1] - this.corners_[2][1];
	var width1 = Math.sqrt(dx*dx + dy*dy);
	dx = this.corners_[0][0] - this.corners_[1][0];
	dy = this.corners_[0][1] - this.corners_[1][1];
	var width2 = Math.sqrt(dx*dx + dy*dy);

	// height (TL to BL, TR to BR)
	dx = this.corners_[3][0] - this.corners_[0][0];
	dy = this.corners_[3][1] - this.corners_[0][1];
	var height1 = Math.sqrt(dx*dx + dy*dy);
	dx = this.corners_[2][0] - this.corners_[1][0];
	dy = this.corners_[2][1] - this.corners_[1][1];
	var height2 = Math.sqrt(dx*dx + dy*dy);

	return [Math.max(width1, width2), Math.max(height1, height2)];
}
GroundOverlayEX_element_imageLLQ.prototype.computeCenterOfQuad_ = function(pMethod) {
	// Introduction: https://en.wikipedia.org/wiki/Quadrilateral#Remarkable_points_and_lines_in_a_convex_quadrilateral
	// there are two approaches:  intersection of corner-diagonals, or intersection of opposite midpoints (aka bimedians) (the vertix centroid)
	// a nice diagram is at: http://www.cut-the-knot.org/Curriculum/Geometry/AnyQuadri.shtml
	// based upon math theory, it is apparent the corner-diagonals method is not sufficiently accurate
	var line1 = [0,0,0,0];
	var line2 = [0,0,0,0];
	
	// this.corners_ order:  BL, BR, TR, TL
	if (pMethod == 1) {
		// corner-diagonals method; this is handy as it represents where the original rectangular center has moved to as a result of the 
		// transform; since in most imagery the center is usually focused on or near a landmark, this represents where the landmark has "moved"
		// to on the image
		// line 1 is TR to BL
		line1[0] = this.corners_[2][0];	// TR
		line1[1] = this.corners_[2][1];
		line1[2] = this.corners_[0][0];	// BL
		line1[3] = this.corners_[0][1];

		// line 2 is TL to BR
		line2[0] = this.corners_[3][0];	// TL
		line2[1] = this.corners_[3][1];
		line2[2] = this.corners_[1][0];	// BR
		line2[3] = this.corners_[1][1];
	} else {
		// bimedian method; this is what most people would consider the center of the quad
		// line 1 is TRTL to BLBR
		line1[0] = (this.corners_[2][0] + this.corners_[3][0]) / 2;
		line1[1] = (this.corners_[2][1] + this.corners_[3][1]) / 2;
		line1[2] = (this.corners_[0][0] + this.corners_[1][0]) / 2;
		line1[3] = (this.corners_[0][1] + this.corners_[1][1]) / 2;
		
		// line 2 is BRTR to TLBL
		line2[0] = (this.corners_[1][0] + this.corners_[2][0]) / 2;
		line2[1] = (this.corners_[1][1] + this.corners_[2][1]) / 2;
		line2[2] = (this.corners_[3][0] + this.corners_[0][0]) / 2;
		line2[3] = (this.corners_[3][1] + this.corners_[0][1]) / 2;
	}
	return GOEX_computeIntersectTwoLines_(line1, line2);
}
GroundOverlayEX_element_imageLLQ.prototype.computeApproximateRotationCW_ = function(pBimCenterQuadX, pBimCenterQuadY) {
	// corners order is BL, BR, TR, TL
	// first calculate each original image's center-to-corner ray slopes;
	// note that since browser uses -Y axis but atan2 uses +Y axis, we have to negate the Y terms
	var i;
	var nonborderSize = this.getBoundsSize_()
	var centerRectX = nonborderSize[0] / 2;
	var centerRectY = nonborderSize[1] / 2;
	var origRaySlopes = [0,0,0,0];		// will be in radians and counterclockwise
	origRaySlopes[0] = Math.atan2(-(nonborderSize[1] - centerRectY), 0 - centerRectX);			// BL
	origRaySlopes[1] = Math.atan2(-(nonborderSize[1] - centerRectY), nonborderSize[0] - centerRectX);	// BR
	origRaySlopes[2] = Math.atan2(-(0 - centerRectY), nonborderSize[0] - centerRectX);			// TR
	origRaySlopes[3] = Math.atan2(-(0 - centerRectY), 0 - centerRectX);					// TL
	
	// now calculate the transformed image's bimedian-center-to-corner ray slopes;
	// then calculate the delta slopes from original corner to new corner...this is that corner's rotation;
	// also have to detect when a corner likely rotated past the backside and changed slope signs;
	// also form an average rotation
	var centerQuad = [0,0];
	if (pBimCenterQuadX != 0 && pBimCenterQuadY != 0) { centerQuad[0] = pBimCenterQuadX; centerQuad[1] = pBimCenterQuadY; }
	else { centerQuad = this.computeCenterOfQuad_(0); }	// bimedian center
	var currRaySlopes = [0,0,0,0];
	var rots_radians = [0,0,0,0];
	var avgRot_radians = 0;
	for (i=0; i<4; i++) {
		currRaySlopes[i] = Math.atan2(-(this.corners_[i][1] - centerQuad[1]), this.corners_[i][0] - centerQuad[0]);
		rots_radians[i] = currRaySlopes[i] - origRaySlopes[i];
		if (GOEXsign(currRaySlopes[i]) != GOEXsign(origRaySlopes[i])) {
			if (rots_radians[i] > Math.PI) { rots_radians[i] = (Math.PI*2) - rots_radians[i]; }
			else if (rots_radians[i] < -Math.PI) { rots_radians[i] = (Math.PI*2) + rots_radians[i]; }
		}
		avgRot_radians += rots_radians[i];
	}
	avgRot_radians = avgRot_radians / 4;

	// compute the statisical varances and standard deviation of the 4 corner rotations;
	// using the absolute value of the variance to simplify things a bit in the final step
	var variances_radians = [0,0,0,0];
	var variance_radians = 0;
	for (i=0; i<4; i++) {
		variances_radians[i] = Math.abs(rots_radians[i] - avgRot_radians);
		variance_radians += (variances_radians[i] * variances_radians[i]);
	}
	variance_radians = variance_radians / 4;
	var stdDev_radians = Math.sqrt(variance_radians);

	// now select only those corner rotations that are within the standard deviation allowance;
	// this will "select out" any corner that is at a significantly different rotation than the rest of the corners,
	// which can happen quite a bit with tilt-corrected imagery
	// one stdDev=68.27% of the corners which is a bit low, two stdDev=95.45% which may be too high, 1.645=90%, 1.44=85%, 1.28=80%
	stdDev_radians *= 1.44;
	var avgSelectedRots_radians = 0;
	var cntSelectedRots = 0;
	for (i=0; i<4; i++) {
		if (variances_radians[i] <= stdDev_radians) { cntSelectedRots++; avgSelectedRots_radians += rots_radians[i]; }
	}
	avgSelectedRots_radians = avgSelectedRots_radians / cntSelectedRots;		// average in counter-clockwise radians
	var avgSelectedRots_degrees = -(avgSelectedRots_radians * 180 / Math.PI);	// change to degrees clockwise which the browser expects
	return avgSelectedRots_degrees;
}

//////////////////////////////////////////////////////////////////////////////
// GOEX_element_* classes
//////////////////////////////////////////////////////////////////////////////
// editing_element_ classes
//////////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 */
window['GroundOverlayEX_element_border'] = GroundOverlayEX_element_border;
function GroundOverlayEX_element_border(pGOEX, pNonBorderWidth, pNonBorderHeight) {
	this.parentGOEX_ = pGOEX;
	this.id_ = "bdr";
	this.added_ = false;
	this.cornersWB_ = null;				// if used, this *includes* borders
	this.node_ = document.createElement('div');
	this.node_.parentGOEX = pGOEX;
	this.node_.id = "GOEXeditBdr";
	this.node_.style.position = 'absolute';
	this.node_.style.visibility = "visible";
	this.node_.style.border = '2px solid Fuchsia';
	this.node_.style.width = pNonBorderWidth + "px";
	this.node_.style.height = pNonBorderHeight + "px";
}
GroundOverlayEX_element_border.prototype.destroy_ = function() {
	this.removeFromMap_();

	this.parentGOEX_ = null;
	if (this.cornersWB_ != null) {
		for (var i in this.cornersWB_) { this.cornersWB_[i] = null; }
		this.cornersWB_ = null;
	}
	this.node_.parentGOEX = null;
	delete this.node_.parentGOEX;
	this.node_ = null;
}
GroundOverlayEX_element_border.prototype.addToMapLayer_ = function(pLayer) {
	if (!this.added_) {
		pLayer.appendChild(this.node_);
		this.added_ = true;
	}
}
GroundOverlayEX_element_border.prototype.removeFromMap_ = function() {
	if (this.added_) {
		this.node_.parentNode.removeChild(this.node_);
		this.added_ = false;
	}
}
GroundOverlayEX_element_border.prototype.setVisible_ = function(pVisible) {
	// ignored for a border; the border must always be visible
}
GroundOverlayEX_element_border.prototype.getBoundsLeftTopXY_ = function() {
	return [this.node_.offsetLeft + this.node_.clientLeft, this.node_.offsetTop + this.node_.clientTop];
}
GroundOverlayEX_element_border.prototype.getBoundsSize_ = function() {
	// return: width, height
	return [this.node_.clientWidth, this.node_.clientHeight];
}
GroundOverlayEX_element_border.prototype.getPositionXY_ = function() {
	var centerX = (this.node_.offsetLeft + this.node_.clientLeft) + Math.round(this.node_.clientWidth / 2);
	var centerY = (this.node_.offsetTop + this.node_.clientTop) + Math.round(this.node_.clientHeight / 2);
	return [centerX, centerY];
}
GroundOverlayEX_element_border.prototype.doZindex_ = function() {
	var z = this.parentGOEX_.getEffectiveZindex();
	this.node_.style.zIndex = String(z - 1);
}
GroundOverlayEX_element_border.prototype.adjustEditingLLB_ = function(pNonBorderLeft, pNonBorderTop) {
	// set the transform default for rotation
	this.node_.style["-webkit-transformOrigin"] = "50% 50%";	  
	this.node_.style["-ms-transformOrigin"] = "50% 50%";
	this.node_.style["-o-transformOrigin"] = "50% 50%";
	this.node_.style.transformOrigin = "50% 50%";

	this.node_.style.left = (pNonBorderLeft - this.node_.clientLeft) + "px";
	this.node_.style.top = (pNonBorderTop - this.node_.clientTop) + "px";
	this.adjustRotationLLB_();
}
GroundOverlayEX_element_border.prototype.adjustDrawLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.adjustCommonLLB_(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight);
}
GroundOverlayEX_element_border.prototype.adjustDragging_ = function(pDeltaX, pDeltaY, pNonBorderLeft, pNonBorderTop) {
	this.node_.style.left = (pNonBorderLeft - this.node_.clientLeft) + "px";
	this.node_.style.top = (pNonBorderTop - this.node_.clientTop) + "px";
}
GroundOverlayEX_element_border.prototype.adjustRotationLLB_ = function() {
	var rot = -(this.parentGOEX_.rotate_);
	var rotStr = 'rotate(' + rot + 'deg)';
	this.node_.style["-webkit-transform"] = rotStr;	  
	this.node_.style["-ms-transform"] = rotStr;
	this.node_.style["-o-transform"] = rotStr;
	this.node_.style.transform = rotStr;
}				
GroundOverlayEX_element_border.prototype.adjustSizingLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.adjustCommonLLB_(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight);
}	
GroundOverlayEX_element_border.prototype.adjustRevertLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	// only called for reverting during LLB-mode
	this.adjustCommonLLB_(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight);
}
GroundOverlayEX_element_border.prototype.adjustCommonLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.node_.style.width = pNonBorderWidth + "px";
	this.node_.style.height = pNonBorderHeight + "px";
	this.node_.style.left = (pNonBorderLeft - this.node_.clientLeft) + "px";
	this.node_.style.top = (pNonBorderTop - this.node_.clientTop) + "px";
	this.adjustRotationLLB_();
}
GroundOverlayEX_element_border.prototype.adjustEditingLLQ_ = function(pBoundsBox) {
	// set the transform default for matrix3d
	this.node_.style["-webkit-transformOrigin"] = "0 0";	  
	this.node_.style["-ms-transformOrigin"] = "0 0";
	this.node_.style["-o-transformOrigin"] = "0 0";
	this.node_.style.transformOrigin = "0 0";

	if (this.cornersWB_ == null) {
		this.cornersWB_ = [];
		for (var i=0; i<4; i++) {
			var point = [0,0];
			this.cornersWB_[i] = point;
		}
		point = null;
	}
	
	this.commonSyncToLLQ_();
}
GroundOverlayEX_element_border.prototype.adjustDrawLLQ_ = function(pBoundsBox) {
	this.commonSyncToLLQ_();
}
GroundOverlayEX_element_border.prototype.adjustSizingLLQ_ = function(pHandle, pDeltaX, pDeltaY, pBoundsBox) {
	this.commonSyncToLLQ_();
}
GroundOverlayEX_element_border.prototype.adjustRevertLLQ_ = function(pBoundsBox) {
	this.commonSyncToLLQ_();
}
GroundOverlayEX_element_border.prototype.commonSyncToLLQ_ = function() {
	var de = this.parentGOEX_.display_element_;
	
	// first place the non-transformed rectange in the same place as the non-transformed image of the display_element_
	var nonborderSize = de.getBoundsSize_();
	var nonborderLeftTop = de.getBoundsLeftTopXY_();
	this.node_.style.width = nonborderSize[0] + "px";
	this.node_.style.height = nonborderSize[1] + "px";
	this.node_.style.left = (nonborderLeftTop[0] - this.node_.clientLeft) + "px";
	this.node_.style.top = (nonborderLeftTop[1] - this.node_.clientTop) + "px";
	nonborderSize = null;
	nonborderLeftTop = null;

	// now calculate the new corners that have the border sizes added to them
	var dx, dy, raySlope, rayDist;
	var centerQuad = de.computeCenterOfQuad_(0);	// bimedians method
	var oneEdgeBordersize = this.node_.clientLeft;
	var increase = Math.sqrt(2 * oneEdgeBordersize * oneEdgeBordersize);
	for (var i=0; i<4; i++) {
		dx = de.corners_[i][0] - centerQuad[0];
		dy = -(de.corners_[i][1] - centerQuad[1]);
		raySlope = Math.atan2(dy, dx);
		rayDist = Math.sqrt(dx*dx + dy*dy);
		rayDist += increase;
		var point = [0,0];
		this.cornersWB_[i][0] =  Math.round(Math.cos(raySlope) * rayDist) + centerQuad[0];
		this.cornersWB_[i][1] = -Math.round(Math.sin(raySlope) * rayDist) + centerQuad[1];
	}
	centerQuad = null;

	// perform the transform
	this.prepDoQuadrilateralTransform_();
}
GroundOverlayEX_element_border.prototype.prepDoQuadrilateralTransform_ = function() {
	// requires that this.corners_ be properly set with x,y points of the BL, BR, TR, TL corners;
	// get the original (non-transformed) position of the img or canvas, which should never have borders even during editing
	// this gets called fairly often, so be explicit about garbage collection
	var srcSizeWB = [(this.node_.clientWidth + this.node_.clientLeft),  (this.node_.clientHeight + this.node_.clientTop)];
	var srcLeftTopWB = [this.node_.offsetLeft, this.node_.offsetTop];
	
	// perform the quad transform
	this.parentGOEX_.doQuadrilateralTransform_(this.node_, srcLeftTopWB, srcSizeWB, this.cornersWB_);
	srcSizeWB = null;
	srcLeftTopWB = null;
}


/**
 * @constructor
 */
window['GroundOverlayEX_element_bounds'] = GroundOverlayEX_element_bounds;
function GroundOverlayEX_element_bounds(pGOEX, pNonBorderWidth, pNonBorderHeight) {
	this.parentGOEX_ = pGOEX;
	this.id_ = "bnd";
	this.added_ = false;
	this.visible_ = false;
	this.node_ = document.createElement('div');
	this.node_.parentGOEX = pGOEX;
	this.node_.id = "GOEXeditBnd";
	this.node_.style.position = 'absolute';
	this.node_.style.visibility = "visible";
	this.node_.style.border = '2px solid yellow';
	this.node_.style.width = pNonBorderWidth + "px";
	this.node_.style.height = pNonBorderHeight + "px";
}
GroundOverlayEX_element_bounds.prototype.destroy_ = function() {
	this.removeFromMap_();

	this.parentGOEX_ = null;
	this.node_.parentGOEX = null;
	delete this.node_.parentGOEX;
	this.node_ = null;
}
GroundOverlayEX_element_bounds.prototype.addToMapLayer_ = function(pLayer) {
	if (!this.added_) {
		pLayer.appendChild(this.node_);
		this.added_ = true;
	}
}
GroundOverlayEX_element_bounds.prototype.removeFromMap_ = function() {
	if (this.added_) {
		this.node_.parentNode.removeChild(this.node_);
		this.added_ = false;
	}
}
GroundOverlayEX_element_bounds.prototype.setVisible_ = function(pVisible) {
	this.visible_ = pVisible;
	if (this.visible_) { this.node_.style.visibility = "visible"; }
	else { this.node_.style.visibility = "hidden"; }
}
GroundOverlayEX_element_bounds.prototype.getBoundsLeftTopXY_ = function() {
	return [this.node_.offsetLeft + this.node_.clientLeft, this.node_.offsetTop + this.node_.clientTop];
}
GroundOverlayEX_element_bounds.prototype.getBoundsSize_ = function() {
	// return: width, height
	return [this.node_.clientWidth, this.node_.clientHeight];
}
GroundOverlayEX_element_bounds.prototype.getPositionXY_ = function() {
	var centerX = (this.node_.offsetLeft + this.node_.clientLeft) + Math.round(this.node_.clientWidth / 2);
	var centerY = (this.node_.offsetTop + this.node_.clientTop) + Math.round(this.node_.clientHeight / 2);
	return [centerX, centerY];
}
GroundOverlayEX_element_bounds.prototype.doZindex_ = function() {
	var z = this.parentGOEX_.getEffectiveZindex();
	this.node_.style.zIndex = String(z - 2);
}
GroundOverlayEX_element_bounds.prototype.adjustEditingLLB_ = function(pNonBorderLeft, pNonBorderTop) {		
	this.node_.style.left = (pNonBorderLeft - this.node_.clientLeft) + "px";
	this.node_.style.top = (pNonBorderTop - this.node_.clientTop) + "px";
}
GroundOverlayEX_element_bounds.prototype.adjustDrawLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.adjustCommonLLB_(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight);
}
GroundOverlayEX_element_bounds.prototype.adjustDragging_ = function(pDeltaX, pDeltaY, pNonBorderLeft, pNonBorderTop) {
	this.node_.style.left = (pNonBorderLeft - this.node_.clientLeft) + "px";
	this.node_.style.top = (pNonBorderTop - this.node_.clientTop) + "px";
}
GroundOverlayEX_element_bounds.prototype.adjustRotationLLB_ = function() {
	// not applicable
}				
GroundOverlayEX_element_bounds.prototype.adjustSizingLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.adjustCommonLLB_(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight);
}	
GroundOverlayEX_element_bounds.prototype.adjustRevertLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.adjustCommonLLB_(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight);
}
GroundOverlayEX_element_bounds.prototype.adjustCommonLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.node_.style.width = pNonBorderWidth + "px";
	this.node_.style.height = pNonBorderHeight + "px";
	this.node_.style.left = (pNonBorderLeft - this.node_.clientLeft) + "px";
	this.node_.style.top = (pNonBorderTop - this.node_.clientTop) + "px";
}
GroundOverlayEX_element_bounds.prototype.adjustEditingLLQ_ = function(pBoundsBox) {		
	this.adjustCommonLLQ_(pBoundsBox);
}
GroundOverlayEX_element_bounds.prototype.adjustDrawLLQ_ = function(pBoundsBox) {
	this.adjustCommonLLQ_(pBoundsBox);
}
GroundOverlayEX_element_bounds.prototype.adjustSizingLLQ_ = function(pHandle, pDeltaX, pDeltaY, pBoundsBox) {
	// ignored for a LLQ resize
}
GroundOverlayEX_element_bounds.prototype.adjustRevertLLQ_ = function(pBoundsBox) {
	this.adjustCommonLLQ_(pBoundsBox);
}
GroundOverlayEX_element_bounds.prototype.adjustCommonLLQ_ = function(pBoundsBox) {
	var nonborderSize = this.parentGOEX_.display_element_.getBoundsSize_();
	var nonborderLeftTop = this.parentGOEX_.display_element_.getBoundsLeftTopXY_();

	this.node_.style.width = nonborderSize[0] + "px";
	this.node_.style.height = nonborderSize[1] + "px";
	this.node_.style.left = (nonborderLeftTop[0] - this.node_.clientLeft) + "px";
	this.node_.style.top = (nonborderLeftTop[1] - this.node_.clientTop) + "px";
}

/**
 * @constructor
 */
window['GroundOverlayEX_element_region'] = GroundOverlayEX_element_region;
function GroundOverlayEX_element_region(pGOEX, pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.parentGOEX_ = pGOEX;
	this.id_ = "rgn";
	this.added_ = false;
	this.visible_ = false;
	this.node_ = document.createElement('div');
	this.node_.parentGOEX = pGOEX;
	this.node_.id = "GOEXeditRgn";
	this.node_.style.position = 'absolute';
	this.node_.style.visibility = "hidden";
	this.node_.style.border = '2px solid red';

	// need to calculate the offsets between the current RegionBounds and the Image bounds in case the application set a larger or smaller region
	var overlayProjection = pGOEX.getProjection();
	var nepoint = overlayProjection.fromLatLngToDivPixel(pGOEX.regionBounds_.getNorthEast());
	var swpoint = overlayProjection.fromLatLngToDivPixel(pGOEX.regionBounds_.getSouthWest());

	this.offsetLeft_ = swpoint.x - pNonBorderLeft;
	this.offsetTop_ = nepoint.y - pNonBorderTop;
	this.offsetWidth_ = Math.abs(nepoint.x - swpoint.x) - pNonBorderWidth;
	this.offsetHeight_ = Math.abs(nepoint.y - swpoint.y) - pNonBorderHeight;

	this.node_.style.width = (pNonBorderWidth + this.offsetWidth_) + "px";
	this.node_.style.height = (pNonBorderHeight + this.offsetHeight_) + "px";
}
GroundOverlayEX_element_region.prototype.destroy_ = function() {
	this.removeFromMap_();

	this.parentGOEX_ = null;
	this.node_.parentGOEX = null;
	delete this.node_.parentGOEX;
	this.node_ = null;
}
GroundOverlayEX_element_region.prototype.addToMapLayer_ = function(pLayer) {
	if (!this.added_) {
		pLayer.appendChild(this.node_);
		this.added_ = true;
	}
}
GroundOverlayEX_element_region.prototype.removeFromMap_ = function() {
	if (this.added_) {
		this.node_.parentNode.removeChild(this.node_);
		this.added_ = false;
	}
}
GroundOverlayEX_element_region.prototype.setVisible_ = function(pVisible) {
	this.visible_ = pVisible;
	if (this.visible_) { this.node_.style.visibility = "visible"; }
	else { this.node_.style.visibility = "hidden"; }
}
GroundOverlayEX_element_region.prototype.getBoundsLeftTopXY_ = function() {
	return [this.node_.offsetLeft + this.node_.clientLeft, this.node_.offsetTop + this.node_.clientTop];
}
GroundOverlayEX_element_region.prototype.getBoundsSize_ = function() {
	// return: width, height
	return [this.node_.clientWidth, this.node_.clientHeight];
}
GroundOverlayEX_element_region.prototype.getPositionXY_ = function() {
	var centerX = (this.node_.offsetLeft + this.node_.clientLeft) + Math.round(this.node_.clientWidth / 2);
	var centerY = (this.node_.offsetTop + this.node_.clientTop) + Math.round(this.node_.clientHeight / 2);
	return [centerX, centerY];
}
GroundOverlayEX_element_region.prototype.doZindex_ = function() {
	var z = this.parentGOEX_.getEffectiveZindex();
	this.node_.style.zIndex = String(z - 2);
}
GroundOverlayEX_element_region.prototype.adjustEditingLLB_ = function(pNonBorderLeft, pNonBorderTop) {		
	this.adjustCommonLLB_();
}
GroundOverlayEX_element_region.prototype.adjustDrawLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.adjustCommonLLB_();
}
GroundOverlayEX_element_region.prototype.adjustDragging_ = function(pDeltaX, pDeltaY, pNonBorderLeft, pNonBorderTop) {
	this.adjustCommonLLB_();
}
GroundOverlayEX_element_region.prototype.adjustRotationLLB_ = function() {
	this.adjustCommonLLB_();
}				
GroundOverlayEX_element_region.prototype.adjustSizingLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.adjustCommonLLB_();
}
GroundOverlayEX_element_region.prototype.adjustRevertLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.adjustCommonLLB_();
}	
GroundOverlayEX_element_region.prototype.adjustCommonLLB_ = function() {
	// all region adjustments based upon LLB-mode are defined by the bounds box
	var bb = this.parentGOEX_.display_element_.getBoundsBox_();		// returns: BL, TR, size
	this.node_.style.left = (bb[0][0] - this.node_.clientLeft + this.offsetLeft_) + "px";
	this.node_.style.top = (bb[1][1] - this.node_.clientTop + this.offsetTop_) + "px";
	this.node_.style.width = (bb[2][0] + this.offsetWidth_) + "px";
	this.node_.style.height = (bb[2][1] + this.offsetHeight_) + "px";
}
GroundOverlayEX_element_region.prototype.adjustEditingLLQ_ = function(pBoundsBox) {		
	this.node_.style.left = (pBoundsBox[0][0] - this.node_.clientLeft + this.offsetLeft_) + "px";
	this.node_.style.top = (pBoundsBox[1][1] - this.node_.clientTop + this.offsetTop_) + "px";
}
GroundOverlayEX_element_region.prototype.adjustDrawLLQ_ = function(pBoundsBox) {
	this.adjustCommonLLQ_(pBoundsBox);
}
GroundOverlayEX_element_region.prototype.adjustSizingLLQ_ = function(pHandle, pDeltaX, pDeltaY, pBoundsBox) {
	this.adjustCommonLLQ_(pBoundsBox);
}
GroundOverlayEX_element_region.prototype.adjustRevertLLQ_ = function(pBoundsBox) {
	this.adjustCommonLLQ_(pBoundsBox);
}
GroundOverlayEX_element_region.prototype.adjustCommonLLQ_ = function(pBoundsBox) {
	// pBoundsBox is BL, TR, size
	this.node_.style.left = (pBoundsBox[0][0] - this.node_.clientLeft + this.offsetLeft_) + "px";
	this.node_.style.top = (pBoundsBox[1][1] - this.node_.clientTop + this.offsetTop_) + "px";
	this.node_.style.width = (pBoundsBox[2][0] + this.offsetWidth_) + "px";
	this.node_.style.height = (pBoundsBox[2][1] + this.offsetHeight_) + "px";
}

/**
 * @constructor
 */
window['GroundOverlayEX_element_editing'] = GroundOverlayEX_element_editing;
function GroundOverlayEX_element_editing(pGOEX, pNonBorderWidth, pNonBorderHeight) {
	this.parentGOEX_ = pGOEX;
	this.id_ = "edt";
	this.added_ = false;
	this.node_ = document.createElement('div');
	this.node_.parentGOEX = pGOEX;
	this.node_.id = "GOEXeditEdt";
	this.node_.style.position = 'absolute';
	this.node_.style.visibility = "visible";	// this must remain visible to capture mouse events
	this.node_.style.border = '0px solid green';
	this.node_.style.width = (pNonBorderWidth + GOEX_EDITING_EXPANSE*2) + "px";
	this.node_.style.height = (pNonBorderHeight + GOEX_EDITING_EXPANSE*2) + "px";
}
GroundOverlayEX_element_editing.prototype.destroy_ = function() {
	this.removeFromMap_();

	this.parentGOEX_ = null;
	this.node_.parentGOEX = null;
	delete this.node_.parentGOEX;
	this.node_ = null;
}
GroundOverlayEX_element_editing.prototype.addToMapLayer_ = function(pLayer) {
	if (!this.added_) {
		pLayer.appendChild(this.node_);
		this.added_ = true;
	}
}
GroundOverlayEX_element_editing.prototype.removeFromMap_ = function() {
	if (this.added_) {
		this.node_.parentNode.removeChild(this.node_);
		this.added_ = false;
	}
}
GroundOverlayEX_element_editing.prototype.setVisible_ = function(pVisible) {
	// always hidden
}
GroundOverlayEX_element_editing.prototype.getBoundsLeftTopXY_ = function() {
	return [this.node_.offsetLeft + this.node_.clientLeft, this.node_.offsetTop + this.node_.clientTop];
}
GroundOverlayEX_element_editing.prototype.getBoundsSize_ = function() {
	// return: width, height
	return [this.node_.clientWidth, this.node_.clientHeight];
}
GroundOverlayEX_element_editing.prototype.getPositionXY_ = function() {
	var centerX = (this.node_.offsetLeft + this.node_.clientLeft) + Math.round(this.node_.clientWidth / 2);
	var centerY = (this.node_.offsetTop + this.node_.clientTop) + Math.round(this.node_.clientHeight / 2);
	return [centerX, centerY];
}
GroundOverlayEX_element_editing.prototype.doZindex_ = function() {
	var z = this.parentGOEX_.getEffectiveZindex();
	this.node_.style.zIndex = String(z - 1);
}
GroundOverlayEX_element_editing.prototype.adjustEditingLLB_ = function(pNonBorderLeft, pNonBorderTop) {		
	this.node_.style.left = (pNonBorderLeft - this.node_.clientLeft - GOEX_EDITING_EXPANSE) + "px";
	this.node_.style.top = (pNonBorderTop - this.node_.clientLeft - GOEX_EDITING_EXPANSE) + "px";
	this.adjustRotationLLB_();
}
GroundOverlayEX_element_editing.prototype.adjustDrawLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.adjustCommonLLB_(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight);
}
GroundOverlayEX_element_editing.prototype.adjustDragging_ = function(pDeltaX, pDeltaY, pNonBorderLeft, pNonBorderTop) {
	this.node_.style.left = (this.node_.offsetLeft + pDeltaX) + "px";
	this.node_.style.top = (this.node_.offsetTop + pDeltaY) + "px";
}
GroundOverlayEX_element_editing.prototype.adjustRotationLLB_ = function() {
	var rot = -(this.parentGOEX_.rotate_);
	var rotStr = 'rotate(' + rot + 'deg)';
	this.node_.style["-webkit-transform"] = rotStr;	  
	this.node_.style["-ms-transform"] = rotStr;
	this.node_.style["-o-transform"] = rotStr;
	this.node_.style.transform = rotStr;
}				
GroundOverlayEX_element_editing.prototype.adjustSizingLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.adjustCommonLLB_(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight);
}	
GroundOverlayEX_element_editing.prototype.adjustRevertLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.adjustCommonLLB_(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight);
}
GroundOverlayEX_element_editing.prototype.adjustCommonLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.node_.style.width = (pNonBorderWidth + GOEX_EDITING_EXPANSE*2) + "px";
	this.node_.style.height = (pNonBorderHeight + GOEX_EDITING_EXPANSE*2) + "px";
	this.node_.style.left = (pNonBorderLeft - this.node_.clientLeft - GOEX_EDITING_EXPANSE) + "px";
	this.node_.style.top = (pNonBorderTop - this.node_.clientLeft - GOEX_EDITING_EXPANSE) + "px";
	this.adjustRotationLLB_();
}
GroundOverlayEX_element_editing.prototype.adjustEditingLLQ_ = function(pBoundsBox) {		
	// pBoundsBox is BL, TR, size
	this.node_.style.left = (pBoundsBox[0][0] - this.node_.clientLeft - GOEX_EDITING_EXPANSE) + "px";
	this.node_.style.top = (pBoundsBox[1][1] - this.node_.clientTop - GOEX_EDITING_EXPANSE) + "px";
}
GroundOverlayEX_element_editing.prototype.adjustDrawLLQ_ = function(pBoundsBox) {
	this.adjustCommonLLQ_(pBoundsBox);
}
GroundOverlayEX_element_editing.prototype.adjustSizingLLQ_ = function(pHandle, pDeltaX, pDeltaY, pBoundsBox) {
	this.adjustCommonLLQ_(pBoundsBox);
}
GroundOverlayEX_element_editing.prototype.adjustRevertLLQ_ = function(pBoundsBox) {
	this.adjustCommonLLQ_(pBoundsBox);
}
GroundOverlayEX_element_editing.prototype.adjustCommonLLQ_ = function(pBoundsBox) {
	// pBoundsBox is BL, TR, size
	this.node_.style.left = (pBoundsBox[0][0] - this.node_.clientLeft - GOEX_EDITING_EXPANSE) + "px";
	this.node_.style.top = (pBoundsBox[1][1] - this.node_.clientTop - GOEX_EDITING_EXPANSE) + "px";
	this.node_.style.width = (pBoundsBox[2][0] + GOEX_EDITING_EXPANSE*2) + "px";
	this.node_.style.height = (pBoundsBox[2][1] + GOEX_EDITING_EXPANSE*2) + "px";
}

/**
 * @constructor
 */
window['GroundOverlayEX_element_centerspot'] = GroundOverlayEX_element_centerspot;
function GroundOverlayEX_element_centerspot(pGOEX, pNonBorderWidth, pNonBorderHeight) {
	this.parentGOEX_ = pGOEX;
	this.id_ = "sp1";
	this.added_ = false;
	this.visible_ = false;
	this.relativeCenterX_ = Math.round(pNonBorderWidth / 2);
	this.relativeCenterY_ = Math.round(pNonBorderHeight / 2);
	this.node_ = document.createElement('div');
	this.node_.parentGOEX = pGOEX;
	this.node_.id = "GOEXeditSp1";
	this.node_.style.position = 'absolute';
	this.node_.style.visibility = "hidden";
	this.node_.style.width = "9px";
	this.node_.style.height = "9px";
	this.node_.style.borderRadius = "50%";
	this.node_.style.backgroundColor = "red";
}
GroundOverlayEX_element_centerspot.prototype.destroy_ = function() {
	this.removeFromMap_();
	this.parentGOEX_ = null;
	this.node_.parentGOEX = null;
	delete this.node_.parentGOEX;
	this.node_ = null;
}
GroundOverlayEX_element_centerspot.prototype.addToMapLayer_ = function(pLayer) {
	if (!this.added_) {
		pLayer.appendChild(this.node_);
		this.added_ = true;
	}
}
GroundOverlayEX_element_centerspot.prototype.removeFromMap_ = function() {
	if (this.added_) {
		this.node_.parentNode.removeChild(this.node_);
		this.added_ = false;
	}
}
GroundOverlayEX_element_centerspot.prototype.setVisible_ = function(pVisible) {
	this.visible_ = pVisible;
	if (this.visible_) { this.node_.style.visibility = "visible"; }
	else { this.node_.style.visibility = "hidden"; }
}
GroundOverlayEX_element_centerspot.prototype.getBoundsLeftTopXY_ = function() {
	return [this.node_.offsetLeft + this.node_.clientLeft, this.node_.offsetTop + this.node_.clientTop];
}
GroundOverlayEX_element_centerspot.prototype.getBoundsSize_ = function() {
	// return: width, height
	return [this.node_.clientWidth, this.node_.clientHeight];
}
GroundOverlayEX_element_centerspot.prototype.getPositionXY_ = function() {
	var centerX = (this.node_.offsetLeft + this.node_.clientLeft) + Math.round(this.node_.clientWidth / 2);
	var centerY = (this.node_.offsetTop + this.node_.clientTop) + Math.round(this.node_.clientHeight / 2);
	return [centerX, centerY];
}
GroundOverlayEX_element_centerspot.prototype.doZindex_ = function() {
	var z = this.parentGOEX_.getEffectiveZindex();
	this.node_.style.zIndex = String(z + 1);
}
GroundOverlayEX_element_centerspot.prototype.adjustEditingLLB_ = function(pNonBorderLeft, pNonBorderTop) {		
	this.node_.style.left = (pNonBorderLeft + this.relativeCenterX_ - 4) + "px";
	this.node_.style.top = (pNonBorderTop + this.relativeCenterY_ - 4) + "px";
}
GroundOverlayEX_element_centerspot.prototype.adjustDrawLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.adjustCommonLLB_(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight);
}
GroundOverlayEX_element_centerspot.prototype.adjustDragging_ = function(pDeltaX, pDeltaY, pNonBorderLeft, pNonBorderTop) {
	this.node_.style.left = (this.node_.offsetLeft + pDeltaX) + "px";
	this.node_.style.top = (this.node_.offsetTop + pDeltaY) + "px";
}
GroundOverlayEX_element_centerspot.prototype.adjustRotationLLB_ = function() {
	// ignored for spots
}				
GroundOverlayEX_element_centerspot.prototype.adjustSizingLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.adjustCommonLLB_(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight);
}	
GroundOverlayEX_element_centerspot.prototype.adjustRevertLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.adjustCommonLLB_(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight);
}
GroundOverlayEX_element_centerspot.prototype.adjustCommonLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.relativeCenterX_ = Math.round(pNonBorderWidth / 2);
	this.relativeCenterY_ = Math.round(pNonBorderHeight / 2);
	this.node_.style.left = (pNonBorderLeft + this.relativeCenterX_ - 4) + "px";
	this.node_.style.top = (pNonBorderTop + this.relativeCenterY_ - 4) + "px";
}
GroundOverlayEX_element_centerspot.prototype.adjustEditingLLQ_ = function(pBoundsBox) {		
	this.adjustCommonLLQ_();
}
GroundOverlayEX_element_centerspot.prototype.adjustDrawLLQ_ = function(pBoundsBox) {
	this.adjustCommonLLQ_();
}
GroundOverlayEX_element_centerspot.prototype.adjustSizingLLQ_ = function(pHandle, pDeltaX, pDeltaY, pBoundsBox) {
	this.adjustCommonLLQ_();
}
GroundOverlayEX_element_centerspot.prototype.adjustRevertLLQ_ = function(pBoundsBox) {
	this.adjustCommonLLQ_();
}
GroundOverlayEX_element_centerspot.prototype.adjustCommonLLQ_ = function() {
	var xy = this.parentGOEX_.display_element_.computeCenterOfQuad_(0);	// bimedian method
	this.node_.style.left = (xy[0] - 4) + "px";
	this.node_.style.top = (xy[1] - 4) + "px";
}

/**
 * @constructor
 */
window['GroundOverlayEX_element_centerspotalt'] = GroundOverlayEX_element_centerspotalt;
function GroundOverlayEX_element_centerspotalt(pGOEX, pNonBorderWidth, pNonBorderHeight) {
	this.parentGOEX_ = pGOEX;
	this.id_ = "sp2";
	this.added_ = false;
	this.visible_ = false;
	this.relativeCenterX_ = Math.round(pNonBorderWidth / 2);
	this.relativeCenterY_ = Math.round(pNonBorderHeight / 2);
	this.node_ = document.createElement('div');
	this.node_.parentGOEX = pGOEX;
	this.node_.id = "GOEXeditSp2";
	this.node_.style.position = 'absolute';
	this.node_.style.visibility = "hidden";
	this.node_.style.width = "9px";
	this.node_.style.height = "9px";
	this.node_.style.borderRadius = "50%";
	this.node_.style.backgroundColor = "yellow";
}
GroundOverlayEX_element_centerspotalt.prototype.destroy_ = function() {
	this.removeFromMap_();

	this.parentGOEX_ = null;
	this.node_.parentGOEX = null;
	delete this.node_.parentGOEX;
	this.node_ = null;
}
GroundOverlayEX_element_centerspotalt.prototype.addToMapLayer_ = function(pLayer) {
	if (!this.added_) {
		pLayer.appendChild(this.node_);
		this.added_ = true;
	}
}
GroundOverlayEX_element_centerspotalt.prototype.removeFromMap_ = function() {
	if (this.added_) {
		this.node_.parentNode.removeChild(this.node_);
		this.added_ = false;
	}
}
GroundOverlayEX_element_centerspotalt.prototype.setVisible_ = function(pVisible) {
	this.visible_ = pVisible;
	if (this.visible_) { this.node_.style.visibility = "visible"; }
	else { this.node_.style.visibility = "hidden"; }
}
GroundOverlayEX_element_centerspotalt.prototype.getBoundsLeftTopXY_ = function() {
	return [this.node_.offsetLeft + this.node_.clientLeft, this.node_.offsetTop + this.node_.clientTop];
}
GroundOverlayEX_element_centerspotalt.prototype.getBoundsSize_ = function() {
	// return: width, height
	return [this.node_.clientWidth, this.node_.clientHeight];
}
GroundOverlayEX_element_centerspotalt.prototype.getPositionXY_ = function() {
	var centerX = (this.node_.offsetLeft + this.node_.clientLeft) + Math.round(this.node_.clientWidth / 2);
	var centerY = (this.node_.offsetTop + this.node_.clientTop) + Math.round(this.node_.clientHeight / 2);
	return [centerX, centerY];
}
GroundOverlayEX_element_centerspotalt.prototype.doZindex_ = function() {
	var z = this.parentGOEX_.getEffectiveZindex();
	this.node_.style.zIndex = String(z + 1);
}
GroundOverlayEX_element_centerspotalt.prototype.adjustEditingLLB_ = function(pNonBorderLeft, pNonBorderTop) {		
	this.node_.style.left = (pNonBorderLeft + this.relativeCenterX_ - 4) + "px";
	this.node_.style.top = (pNonBorderTop + this.relativeCenterY_ - 4) + "px";
}
GroundOverlayEX_element_centerspotalt.prototype.adjustDrawLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.adjustCommonLLB_(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight);
}
GroundOverlayEX_element_centerspotalt.prototype.adjustDragging_ = function(pDeltaX, pDeltaY, pNonBorderLeft, pNonBorderTop) {
	this.node_.style.left = (this.node_.offsetLeft + pDeltaX) + "px";
	this.node_.style.top = (this.node_.offsetTop + pDeltaY) + "px";
}
GroundOverlayEX_element_centerspotalt.prototype.adjustRotationLLB_ = function() {
	// ignored for spots
}				
GroundOverlayEX_element_centerspotalt.prototype.adjustSizingLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.adjustCommonLLB_(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight);
}	
GroundOverlayEX_element_centerspotalt.prototype.adjustRevertLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.adjustCommonLLB_(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight);
}
GroundOverlayEX_element_centerspotalt.prototype.adjustCommonLLB_ = function(pNonBorderLeft, pNonBorderTop, pNonBorderWidth, pNonBorderHeight) {
	this.relativeCenterX_ = Math.round(pNonBorderWidth / 2);
	this.relativeCenterY_ = Math.round(pNonBorderHeight / 2);
	this.node_.style.left = (pNonBorderLeft + this.relativeCenterX_ - 4) + "px";
	this.node_.style.top = (pNonBorderTop + this.relativeCenterY_ - 4) + "px";
}
GroundOverlayEX_element_centerspotalt.prototype.adjustEditingLLQ_ = function(pBoundsBox) {		
	this.adjustCommonLLQ_();
}
GroundOverlayEX_element_centerspotalt.prototype.adjustDrawLLQ_ = function(pBoundsBox) {
	this.adjustCommonLLQ_();
}
GroundOverlayEX_element_centerspotalt.prototype.adjustSizingLLQ_ = function(pHandle, pDeltaX, pDeltaY, pBoundsBox) {
	this.adjustCommonLLQ_();
}
GroundOverlayEX_element_centerspotalt.prototype.adjustRevertLLQ_ = function(pBoundsBox) {
	this.adjustCommonLLQ_();
}
GroundOverlayEX_element_centerspotalt.prototype.adjustCommonLLQ_ = function() {
	var xy = this.parentGOEX_.display_element_.computeCenterOfQuad_(1);	// diagonals method
	this.node_.style.left = (xy[0] - 4) + "px";
	this.node_.style.top = (xy[1] - 4) + "px";
}

//////////////////////////////////////////////////////////////////////////////
// ZoomArray code including ZoomEntry* classes 
//////////////////////////////////////////////////////////////////////////////

// Google Maps V3 Zoom levels to equivalent Google Earth altitudes
// zoom levels range from 0 to 22
var ZoomEntryZoomEarthZooms_m = [ 30000000, 24000000, 18000000, 10000000, 4000000, 1900000, 1100000, 550000, 280000, 170000, 82000, 38000, 19000, 9200, 4300, 2000, 990, 570, 280, 100, 36, 12, 0 ];
var ZoomEntryZoomEarthZooms_ft = [ 98425197, 78740157, 59055118, 32808399, 13123360, 6233596, 3608924, 1804462, 918635, 557743, 269029, 124672, 62336, 30184, 14108, 6562, 3248, 1870, 919, 328, 118, 39, 0 ];

/**
 * @constructor
 */
window['ZoomArray'] = ZoomArray;
function ZoomArray() {
	this.objArray_ = [];
}
ZoomArray.prototype['destroy'] = ZoomArray.prototype.destroy;
ZoomArray.prototype.destroy = function() {
	for (var i in this.objArray_) { this.objArray_[i] = null; }
	this.objArray_ = null;
}
ZoomArray.prototype['length'] = ZoomArray.prototype.length;
ZoomArray.prototype.length = function() {
	return this.objArray_.length;
}
ZoomArray.prototype['addZoomEntry'] = ZoomArray.prototype.addZoomEntry;
ZoomArray.prototype.addZoomEntry = function(pZoomEntry) {
	var c = this.objArray_.length;
	this.objArray_[c] = pZoomEntry;
}
ZoomArray.prototype['prependZoomEntry'] = ZoomArray.prototype.prependZoomEntry;
ZoomArray.prototype.prependZoomEntry = function(pZoomEntry) {
	var c = this.objArray_.length;
	for (var i=c-1; i>=0; i--) { this.objArray_[i+1] = this.objArray_[i]; }
	this.objArray_[0] = pZoomEntry;
}
ZoomArray.prototype['getUrl'] = ZoomArray.prototype.getUrl;
ZoomArray.prototype.getUrl = function(pIndex) {
	return this.objArray_[pIndex].url_;
}
ZoomArray.prototype['whichIndexPerUrl'] = ZoomArray.prototype.whichIndexPerUrl;
ZoomArray.prototype.whichIndexPerUrl = function(pURL) {
	for (var i in this.objArray_) {
		if (pURL == this.objArray_[i].url_) { return i; }
	}
	return -1;
}
ZoomArray.prototype['whichIndexPerZoom'] = ZoomArray.prototype.whichIndexPerZoom;
ZoomArray.prototype.whichIndexPerZoom = function(pZoom) {
	for (var i in this.objArray_) {
		if (pZoom >=  this.objArray_[i].zoomLow_ && pZoom <=  this.objArray_[i].zoomHigh_) { return i; }
	}
	return -1;
}

window['ZoomEntryZoom'] = ZoomEntryZoom;
/**
 * @constructor
 */
function ZoomEntryZoom(mapZoomLow, mapZoomHigh, url) {
	this.zoomLow_ = mapZoomLow;
	this.zoomHigh_ = mapZoomHigh;
	this.url_ = url;
}
window['ZoomEntryAlt_ft'] = ZoomEntryAlt_ft;
/**
 * @constructor
 */
function ZoomEntryAlt_ft(alt_ft_Low, alt_ft_High, url) {
	this.alt_ft_Low_ = alt_ft_Low;
	this.alt_ft_High_ = alt_ft_High;
	this.url_ = url;
	this.zoomLow_ = this.alt_ft_ToZoom_(alt_ft_Low);
	this.zoomHigh_ = this.alt_ft_ToZoom_(alt_ft_High);
}
ZoomEntryAlt_ft.prototype.alt_ft_ToZoom_ = function(pAlt_ft) {
	if (pAlt_ft <= 0) return 22;
	if (pAlt_ft >= ZoomEntryZoomEarthZooms_ft[0]) return 0;

	for (var i=0; i<22; i++) {
        	if (pAlt_ft > (ZoomEntryZoomEarthZooms_ft[i] + ZoomEntryZoomEarthZooms_ft[i+1])/2) return i;
    	}
	return 22;
}
window['ZoomEntryAlt_m'] = ZoomEntryAlt_m;
/**
 * @constructor
 */
function ZoomEntryAlt_m(alt_m_Low, alt_m_High, url) {
	this.alt_m_Low_ = alt_m_Low;
	this.alt_m_High_ = alt_m_High;
	this.url_ = url;
	this.zoomLow_ = this.alt_m_ToZoom_(alt_m_Low);
	this.zoomHigh_ = this.alt_m_ToZoom_(alt_m_High);
}
ZoomEntryAlt_m.prototype.alt_m_ToZoom_ = function(pAlt_m) {
	if (pAlt_m <= 0) return 22;
	if (pAlt_m >= ZoomEntryZoomEarthZooms_m[0]) return 0;

	for (var i=0; i<22; i++) {
        	if (pAlt_m > (ZoomEntryZoomEarthZooms_m[i] + ZoomEntryZoomEarthZooms_m[i+1])/2) return i;
    	}
	return 22;
}

//////////////////////////////////////////////////////////////////////////////
// LatLngQuad code
//////////////////////////////////////////////////////////////////////////////
LatLngQuad.prototype = new google.maps.MVCObject();
window['LatLngQuad'] = LatLngQuad;
/**
 * @constructor
 */
function LatLngQuad(blLatLng, brLatLng, trLatLng, tlLatLng) {
	this.valid_ = true;
	this.LatLngs_ = [];
	this.LatLngs_[0] = blLatLng;
	this.LatLngs_[1] = brLatLng;
	this.LatLngs_[2] = trLatLng
	this.LatLngs_[3] = tlLatLng;
	this.northmost_ = Math.max(this.LatLngs_[0].lat(), this.LatLngs_[1].lat(), this.LatLngs_[2].lat(), this.LatLngs_[3].lat());
	this.southmost_ = Math.min(this.LatLngs_[0].lat(), this.LatLngs_[1].lat(), this.LatLngs_[2].lat(), this.LatLngs_[3].lat());
	this.eastmost_ = Math.max(this.LatLngs_[0].lng(), this.LatLngs_[1].lng(), this.LatLngs_[2].lng(), this.LatLngs_[3].lng());
	this.westmost_ = Math.min(this.LatLngs_[0].lng(), this.LatLngs_[1].lng(), this.LatLngs_[2].lng(), this.LatLngs_[3].lng());
	this.intersectOfBimedians_ = this.calculateBimedianCenter_();
}
LatLngQuad.prototype['destroy'] = LatLngQuad.prototype.destroy;
LatLngQuad.prototype.destroy = function() {
	this.valid_ = false;
	this.LatLngs_[0] = null;
	this.LatLngs_[1] = null;
	this.LatLngs_[2] = null;
	this.LatLngs_[3] = null;
	this.LatLngs_ = null;
	this.intersectOfBimedians_ = null;
}
LatLngQuad.prototype['isEmpty'] = LatLngQuad.prototype.isEmpty;
LatLngQuad.prototype.isEmpty = function() {
	return this.valid_;
}
LatLngQuad.prototype['getBottomLeft'] = LatLngQuad.prototype.getBottomLeft;
LatLngQuad.prototype.getBottomLeft = function() {
	return this.LatLngs_[0];
}
LatLngQuad.prototype['getBottomRight'] = LatLngQuad.prototype.getBottomRight;
LatLngQuad.prototype.getBottomRight = function() {
	return this.LatLngs_[1];
}
LatLngQuad.prototype['getTopRight'] = LatLngQuad.prototype.getTopRight;
LatLngQuad.prototype.getTopRight = function() {
	return this.LatLngs_[2];
}
LatLngQuad.prototype['getTopLeft'] = LatLngQuad.prototype.getTopLeft;
LatLngQuad.prototype.getTopLeft = function() {
	return this.LatLngs_[3];
}
LatLngQuad.prototype['getNorthMostLat'] = LatLngQuad.prototype.getNorthMostLat;
LatLngQuad.prototype.getNorthMostLat = function() {
	return this.northmost_;
}
LatLngQuad.prototype['getSouthMostLat'] = LatLngQuad.prototype.getSouthMostLat;
LatLngQuad.prototype.getSouthMostLat = function() {
	return this.southmost_;
}
LatLngQuad.prototype['getEastMostLng'] = LatLngQuad.prototype.getEastMostLng;
LatLngQuad.prototype.getEastMostLng = function() {
	return this.eastmost_;
}
LatLngQuad.prototype['getWestMostLng'] = LatLngQuad.prototype.getWestMostLng;
LatLngQuad.prototype.getWestMostLng = function() {
	return this.westmost_;
}
LatLngQuad.prototype['getBoundsBox'] = LatLngQuad.prototype.getBoundsBox;
LatLngQuad.prototype.getBoundsBox = function() {
	var ne = new google.maps.LatLng(this.northmost_, this.eastmost_);
	var sw = new google.maps.LatLng(this.southmost_, this.westmost_);
	var bounds = new google.maps.LatLngBounds(sw, ne);
	return bounds;
}
LatLngQuad.prototype['toSpan'] = LatLngQuad.prototype.toSpan;
LatLngQuad.prototype.toSpan = function() {
	var ne = new google.maps.LatLng(this.northmost_, this.eastmost_);
	var sw = new google.maps.LatLng(this.southmost_, this.westmost_);
	var bounds = new google.maps.LatLngBounds(sw, ne);
	return bounds.toSpan();
}
LatLngQuad.prototype['getPosition'] = LatLngQuad.prototype.getPosition;
LatLngQuad.prototype.getPosition = function() {
	var ne = new google.maps.LatLng(this.northmost_, this.eastmost_);
	var sw = new google.maps.LatLng(this.southmost_, this.westmost_);
	var bounds = new google.maps.LatLngBounds(sw, ne);
	return bounds.getCenter();
}
LatLngQuad.prototype['getCenter'] = LatLngQuad.prototype.getCenter;
LatLngQuad.prototype.getCenter = function() {
	return this.intersectOfBimedians_;
}
LatLngQuad.prototype['inBoundsBox'] = LatLngQuad.prototype.inBoundsBox;
LatLngQuad.prototype.inBoundsBox = function(pLatLng) {
	// ??? this code does not support spanning the international date line
	var result = false;
	var lat = pLatLng.lat();
	var lng = pLatLng.lng();
	if (lat >= this.southmost_ && lat <= this.northmost_ && lng >= this.westmost_ && lng <= this.eastmost_) result = true;
	return result;
}
LatLngQuad.prototype['toString'] = LatLngQuad.prototype.toString;
LatLngQuad.prototype.toString = function() {
	var results = "";
	for (var i=0; i<4; i++) {
		if (results.length > 0) results += ",";
		results += this.LatLngs_[i].toString();
	}
	return results;
}
LatLngQuad.prototype['toUrlValue'] = LatLngQuad.prototype.toUrlValue;
LatLngQuad.prototype.toUrlValue = function(pPrecision) {
	var results = "";
	for (var i=0; i<4; i++) {
		if (results.length > 0) results += ",";
		results += this.LatLngs_[i].toUrlValue(pPrecision);
	}
	return results;
}
LatLngQuad.prototype.calculateBimedianCenter_ = function() {
	// see GroundOverlayEX_element_imageLLQ.prototype.computeCenterOfQuad_() for notes
	// to make things easier, going to convert the latlng's into Mercator world coordinates
	// to avoid needing to use arc-math to account for Earth's curvature and latitude convergence;
	// however this will be inaccurate near the poles
	var blxy = this.fromLatLngToWorldPoint_(this.LatLngs_[0]);
	var brxy = this.fromLatLngToWorldPoint_(this.LatLngs_[1]);
	var trxy = this.fromLatLngToWorldPoint_(this.LatLngs_[2]);
	var tlxy = this.fromLatLngToWorldPoint_(this.LatLngs_[3]);

	// line 1 is TRTL to BLBR
	var line1 = [];
	line1[0] = (trxy[0] + tlxy[0]) / 2;
	line1[1] = (trxy[1] + tlxy[1]) / 2;
	line1[2] = (blxy[0] + brxy[0]) / 2;
	line1[3] = (blxy[1] + brxy[1]) / 2;
		
	// line 2 is BRTR to TLBL
	var line2 = [];
	line2[0] = (brxy[0] + trxy[0]) / 2;
	line2[1] = (brxy[1] + trxy[1]) / 2;
	line2[2] = (tlxy[0] + blxy[0]) / 2;
	line2[3] = (tlxy[1] + blxy[1]) / 2;
	blxy = null;
	brxy = null;
	trxy = null;
	tlxy = null;
	
	var centerxy = GOEX_computeIntersectTwoLines_(line1, line2);
	line1 = null
	line2 = null;
	var centerLL = this.fromWorldPointToLatLng_(centerxy[0], centerxy[1]);
	return centerLL;
}
LatLngQuad.prototype.fromLatLngToWorldPoint_ = function(latLng) {
	var x = 512 + latLng.lng() * (1024 / 360);

	// Truncating to 0.9999 effectively limits latitude to 89.189. This is about a third of a tile past the edge of the world tile.
	var rlat = latLng.lat() * (Math.PI / 180);
	var siny = Math.sin(rlat);
	if (siny > .9999) siny = .9999;
	else if (siny < -.9999) siny = -.9999;
	var y = 512 + 0.5 * Math.log((1 + siny) / (1 - siny)) * -(1024 / (2 * Math.PI));
	return [x, y];
}
LatLngQuad.prototype.fromWorldPointToLatLng_ = function(x, y) {
	var lng = (x - 512) / (1024 / 360);
	var rlat1 = (y - 512) / -(1024 / (2 * Math.PI));
	var rlat2 = 2 * Math.atan(Math.exp(rlat1)) - Math.PI / 2;
	var lat = rlat2 / (Math.PI / 180);
	return new google.maps.LatLng(lat, lng);
}


//////////////////////////////////////////////////////////////////////////////
// GroundOverlayEX_mgr code
//////////////////////////////////////////////////////////////////////////////
GroundOverlayEX_mgr.prototype = new google.maps.MVCObject();
// public functions
window['GroundOverlayEX_mgr'] = GroundOverlayEX_mgr;
/**
 * @constructor
 */
function GroundOverlayEX_mgr(pMap, pOptions) {
	// constructor
	this.map_ = pMap;
	this.preloadRegionFactor_ = 1;
	this.mapBoundsPlace_ = this.getLargerMapBounds_(1);
	this.mapBoundsLoad_ = this.getLargerMapBounds_(this.preloadRegionFactor_);
	this.indexOfGOEXs_ = [];
	this.indexOfMapEnabled_ = [];
	this.indexOfLoadRecommend_ = [];

	if (pOptions != undefined && pOptions != null) {
		if (pOptions.placementRegion != undefined) { this.setPlacementRegion(pOptions.placementRegion); }
		if (pOptions.preloadRegion != undefined) { this.setPreloadRegion(pOptions.preloadRegion); }
	}

	var that = this;
	this.mgrListener1_ = google.maps.event.addDomListener(this.map_, "bounds_changed", function() { GroundOverlayEX_mgr_mapBoundsChanged_(that); });
}
GroundOverlayEX_mgr.prototype['destroy'] = GroundOverlayEX_mgr.prototype.destroy;
GroundOverlayEX_mgr.prototype.destroy = function() {
	// this is non-recoverable
	var i;
	if (this.mgrListener1_ != null) google.maps.event.removeListener(this.mgrListener1_);

	for (i in this.indexOfGOEXs_) {
		if (this.indexOfGOEXs_[i] != null) {
			this.indexOfGOEXs_[i].destroy();
			this.indexOfGOEXs_[i] = null;
			this.indexOfMapEnabled_[i] = false;
			this.indexOfLoadRecommend_[i] = false;
		}
	}

	this.map_ = null;
	this.mapBoundsPlace_ = null;
	this.mapBoundsLoad_ = null;
	this.indexOfGOEXs_ = null;
	this.indexOfMapEnabled_ = null;
	this.indexOfLoadRecommend_ = null;
}
GroundOverlayEX_mgr.prototype['getVersion'] = GroundOverlayEX_mgr.prototype.getVersion;
GroundOverlayEX_mgr.prototype.getVersion = function() {
	return GROUNDOVERLAYEX_VERSION;
}
GroundOverlayEX_mgr.prototype['getMap'] = GroundOverlayEX_mgr.prototype.getMap;
GroundOverlayEX_mgr.prototype.getMap = function() {
	return this.map_;
}
GroundOverlayEX_mgr.prototype['addGOEX'] = GroundOverlayEX_mgr.prototype.addGOEX;
GroundOverlayEX_mgr.prototype.addGOEX = function(pGOEX) {
	// add another GroundOverlayEX object into management
	if (pGOEX.regionBounds_ == null) return false;

	var c = this.indexOfGOEXs_.length;
	this.indexOfGOEXs_[c] = pGOEX;
	pGOEX.manager_ = this;
	this.indexOfMapEnabled_[c] = false;
	this.indexOfLoadRecommend_[c] = false;

	this.performAnAssessment_(c, true);
	return true;
}
GroundOverlayEX_mgr.prototype['startOfBulkload'] = GroundOverlayEX_mgr.prototype.startOfBulkload;
GroundOverlayEX_mgr.prototype.startOfBulkload = function(pGOEX) {
	// nothing needed here at this time
}
GroundOverlayEX_mgr.prototype['addGOEXbulkload'] = GroundOverlayEX_mgr.prototype.addGOEXbulkload;
GroundOverlayEX_mgr.prototype.addGOEXbulkload = function(pGOEX) {
	// add another GroundOverlayEX object into management
	if (pGOEX.regionBounds_ == null) return false;

	var c = this.indexOfGOEXs_.length;
	this.indexOfGOEXs_[c] = pGOEX;
	pGOEX.manager_ = this;
	this.indexOfMapEnabled_[c] = false;
	this.indexOfLoadRecommend_[c] = false;

	this.performAnAssessment_(c, false);
	return true;
}
GroundOverlayEX_mgr.prototype['endOfBulkload'] = GroundOverlayEX_mgr.prototype.endOfBulkload;
GroundOverlayEX_mgr.prototype.endOfBulkload = function(pGOEX) {
	this.assessAll_();
}
GroundOverlayEX_mgr.prototype['setAllOpacity'] = GroundOverlayEX_mgr.prototype.setAllOpacity;
GroundOverlayEX_mgr.prototype.setAllOpacity = function(pOpacity) {
	for (var i in this.indexOfGOEXs_) {
		this.indexOfGOEXs_[i].setOpacity(pOpacity);
	}
}
GroundOverlayEX_mgr.prototype['getAllQtys'] = GroundOverlayEX_mgr.prototype.getAllQtys;
GroundOverlayEX_mgr.prototype.getAllQtys = function() {
	var qtys = [0,0,0,0,0,0,0,0,0];
	qtys[0] = this.indexOfGOEXs_.length
	
	var i, j, GOEXqtys;
	for (i in this.indexOfGOEXs_) {
		GOEXqtys = this.indexOfGOEXs_[i].mgrGetStats();
		for (j=1; j<9; j++) {
			qtys[j] += GOEXqtys[j-1];
		}
		GOEXqtys = null;
	}
	return qtys;
}
GroundOverlayEX_mgr.prototype['getPlacementRegion'] = GroundOverlayEX_mgr.prototype.getPlacementRegion;
GroundOverlayEX_mgr.prototype.getPlacementRegion = function() {
	// here for future options
	return "zoom2x";
}
GroundOverlayEX_mgr.prototype['setPlacementRegion'] = GroundOverlayEX_mgr.prototype.setPlacementRegion;
GroundOverlayEX_mgr.prototype.setPlacementRegion = function(pPreplaceRegionCode) {
	// here for future options
}
GroundOverlayEX_mgr.prototype['getPreloadRegion'] = GroundOverlayEX_mgr.prototype.getPreloadRegion;
GroundOverlayEX_mgr.prototype.getPreloadRegion = function() {
	return this.preloadRegionFactor_;
}
GroundOverlayEX_mgr.prototype['setPreloadRegion'] = GroundOverlayEX_mgr.prototype.setPreloadRegion;
GroundOverlayEX_mgr.prototype.setPreloadRegion = function(pPreloadRegionScale) {
	var s = Number(pPreloadRegionScale);
	if (s < 0) s = 0;
	else if (s > 1) s = 1;
	this.preloadRegionFactor_ = this.setPreloadRegion(s);
	this.mapBoundsLoad_ = this.getLargerMapBounds_(GOmgr.preloadRegionFactor_);
	this.assessAll_();
}

// supposedly private methods
GroundOverlayEX_mgr.prototype.getLargerMapBounds_ = function(pIncreaseBy) {
	if (pIncreaseBy < 0) pIncreaseBy = 0;
	else if (pIncreaseBy > 1) pIncreaseBy = 1;

	var mapBnds = this.map_.getBounds();
	if (pIncreaseBy == 0) return mapBnds;

	var ne = mapBnds.getNorthEast();
	var sw = mapBnds.getSouthWest();
	var span = mapBnds.toSpan();
	if (span.lng() * 2 >= 360) { east = 180; west = -180; }
	else {
		var widthExtends = span.lng() / 2;
		var east = ne.lng() + widthExtends;
		if (east > 180) east = 180;
		var west = sw.lng() - widthExtends;
		if (west < -180) west = -180;
	}
	if (span.lat() * 2 >= 180) { north = 90; south = -90; }
	else {
		var heightExtends = span.lat() / 2;
		var north = ne.lat() + heightExtends;
		if (north > 90) north = 90;
		var south = sw.lat() - heightExtends;
		if (south < -90) south = -90;
	}

	var nex2 = new google.maps.LatLng(north, east);
	var swx2 = new google.maps.LatLng(south, west);
	var boundsx2 = new google.maps.LatLngBounds(swx2, nex2);
	return boundsx2;
}
GroundOverlayEX_mgr.prototype.assessAll_ = function() {
	for (var i in this.indexOfGOEXs_) {
		this.performAnAssessment_(i, true);
	}	
}
GroundOverlayEX_mgr.prototype.performAnAssessment_ = function(pIndexNo, pDoPreloadRegion) {
	if (this.mapBoundsPlace_.intersects(this.indexOfGOEXs_[pIndexNo].regionBounds_)) {
		// GOEX should be placed on the map
		if (!this.indexOfMapEnabled_[pIndexNo]) {
			this.indexOfGOEXs_[pIndexNo].setMap(this.map_);
			this.indexOfMapEnabled_[pIndexNo] = true;
		}
		if (pDoPreloadRegion) {
			if (this.mapBoundsLoad_.intersects(this.indexOfGOEXs_[pIndexNo].regionBounds_)) {
				// GOEX should be told to pre-load its image
				if (!this.indexOfLoadRecommend_[pIndexNo]) {
					this.indexOfGOEXs_[pIndexNo].mgrRecommendLoadImage();
					this.indexOfLoadRecommend_[pIndexNo] = true;
				}
			}
		}
	} else {
		// GOEX should not be placed into the map
		if (this.indexOfMapEnabled_[pIndexNo]) {
			this.indexOfGOEXs_[pIndexNo].setMap(null);
			this.indexOfMapEnabled_[pIndexNo] = false;
		}
	}
}
function GroundOverlayEX_mgr_mapBoundsChanged_(GOmgr) {
	GOmgr.mapBoundsPlace_ = GOmgr.getLargerMapBounds_(1);
	GOmgr.mapBoundsLoad_ = GOmgr.getLargerMapBounds_(GOmgr.preloadRegionFactor_);
	GOmgr.assessAll_();
}
