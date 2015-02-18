//////////////////////////////////////////////////////////////////////////////
// GroundOverlayEX module
//////////////////////////////////////////////////////////////////////////////
/*
Extended GroundOverlay class for Google Maps API V3
Version: 1.2

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
var GOEX_EDITING_EXPANSE = 100;
var GOEX_ZINDEX_BASE_DEFAULT = 1000;
// Public methods
GroundOverlayEX.prototype = new google.maps.OverlayView();
window['GroundOverlayEX'] = GroundOverlayEX;
/**
 * @constructor
 */
function GroundOverlayEX(url, bounds, GO_opts) {
	// constructor for a new object; if both bounds and latlngQuad (in GO_opts) are provided, then latlngQuad overrules bounds (which will be ignored)
	// basic GO-opts: opacity, clickable, map
	// additional GO_opts:  rotate, cropOrigImgWidth, cropOrigImgHeight, cropFromLeft, cropFromBottom, cropToWidth, cropToHeight, latlngQuad
	// additional GO_opts:  id, displayText, zoomArray, regionBounds, draworder, zIndex, zIndexBase

	// initialize all class variables
	this.id_ = "";
	this.position = null;		// must be a LatLng
	this.manager_ = null;
	this.managerRecommendedLoad_ = false;
	this.displayText_ = "";
	this.bounds_ = null;
	this.boundsOrig_ = null;
	this.regionBounds_ = null;
	this.regionBoundsOrig_ = null;
	this.llq_ = null;
	this.llqOrig_ = null;
	this.llqType_ = "u";		// R=rectangular, N=non-rectangular, u=unknown
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
	this.cropBase_ = [];
	this.cropOrigImgWidth_ = 0;
	this.cropOrigImgHeight_ = 0;
	this.cropFromLeft_ = 0;
	this.cropFromBottom_ = 0;
	this.cropToWidth_ = 0;
	this.cropToHeight_ = 0;
	this.mapAdded_ = false;
	this.imgDisplayed_ = -1;
	this.imgs_ = [];
	this.imgsLoaded_ = [];
	this.canvases_ = [];
	this.div_bounds_ = null;
	this.div_editing_ = null;
	this.displayedElement_ = null;
	this.corners_ = [];		// order is BL, BR, TR, TL
	this.editable_ = false;
	this.doEditing_ = false;
	this.isEditing_ = false;
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

	// process any passed options
	if (GO_opts != undefined && GO_opts != null) {
		if (GO_opts.opacity != undefined) { this.setOpacity(Number(GO_opts.opacity)); }
		if (GO_opts.clickable != undefined) { if (GO_opts.clickable == true) this.clickable_ = true; }
		if (GO_opts.clickableAtZoom != undefined) { if (Number(GO_opts.clickableAtZoom) >= 0) this.clickableAtZoom_ = Number(GO_opts.clickableAtZoom); }
		if (GO_opts.id != undefined) { this.id_ = GO_opts.id; }
		if (GO_opts.displayText != undefined) { this.setDisplayText(GO_opts.displayText); }
		if (GO_opts.rotate != undefined) { this.setRotation(Number(GO_opts.rotate)); }
		if (GO_opts.drawOrder != undefined) { this.setDrawOrder(Number(GO_opts.drawOrder)); }
		if (GO_opts.zIndex != undefined) { this.setzIndex(Number(GO_opts.zIndex)); }
		if (GO_opts.zIndexBase != undefined) { this.zIndexBase(Number(GO_opts.zIndexBase)); }
		if (GO_opts.cropOrigImgWidth != undefined) { if (Number(GO_opts.cropOrigImgWidth) > 0) { this.cropOrigImgWidth_ = Math.round(Number(GO_opts.cropOrigImgWidth)); } }
		if (GO_opts.cropOrigImgHeight != undefined) { if (Number(GO_opts.cropOrigImgHeight) > 0) { this.cropOrigImgHeight_ = Math.round(Number(GO_opts.cropOrigImgHeight)); } }
		if (GO_opts.cropFromLeft != undefined) { if (Number(GO_opts.cropFromLeft) > 0) { this.cropFromLeft_ = Math.round(Number(GO_opts.cropFromLeft)); } }
		if (GO_opts.cropFromBottom != undefined) { if (Number(GO_opts.cropFromBottom) > 0) { this.cropFromBottom_ = Math.round(Number(GO_opts.cropFromBottom)); } }
		if (GO_opts.cropToWidth != undefined) { if (Number(GO_opts.cropToWidth) > 0) { this.cropToWidth_ = Math.round(Number(GO_opts.cropToWidth)); } }
		if (GO_opts.cropToHeight != undefined) { if (Number(GO_opts.cropToHeight) > 0) { this.cropToHeight_ = Math.round(Number(GO_opts.cropToHeight)); } }
		if (GO_opts.latlngQuad != undefined && GO_opts.latlngQuad != null) { this.llq_ = GO_opts.latlngQuad; this.llqOrig_ = GO_opts.latlngQuad; this.bounds_ = null; }
		if (GO_opts.regionBounds != undefined && GO_opts.regionBounds != null) { this.regionBounds_ = GO_opts.regionBounds; this.regionBoundsOrig_ = GO_opts.regionBounds; }
		if (GO_opts.zoomArray != undefined && GO_opts.zoomArray != null) { this.zoomArray_ = GO_opts.zoomArray; }
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
		this.canvases_[i] = null;
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
		if (this.cropOrigImgWidth_ > 0 && this.cropOrigImgHeight_ > 0) {
			this.recordCropBase_(this.cropOrigImgWidth_, this.cropOrigImgHeight_);
		}
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

	this.cropBase_ = null;
	this.GO_opts_ = null;
	this.bounds_ = null;
	this.boundsOrig_ = null;
	if (this.llq_ != null) this.llq_.destroy();
	this.llq_ = null;
	this.llqOrig_ = null;
	if (this.zoomArray_ != null) this.zoomArray_.destroy();
	this.zoomArray_ = null;
	this.regionbounds_ = null;
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
		// setup needed listeners
		this.emplaceProperListeners_();	

		// assess whether there is sufficient information to perform the required cropping
		if (this.cropping_ && this.cropOrigImgWidth_ <= 0 && this.cropOrigImgHeight_ <= 0 && this.zoomArray_.length() > 1) {
			// nope, need to force load the passed url image
			var r = this.zoomArray_.whichIndexPerUrl(this.url_);
			this.doLoadImageNumber_(r);
		}
		
		// initiate assessment of the GOEX's region with what the map is showing
		this.assessRegion_();
	}	
}
GroundOverlayEX.prototype['onRemove'] = GroundOverlayEX.prototype.onRemove;
GroundOverlayEX.prototype.onRemove = function() {
	// this get called when the Google Maps framework is removing the GroundOverlay;
	// however it is not a destructor, and needs to be recoverable upon a subsequence OnAdd call
	this.doDisplayImageNumber_(-1);	// this also auto-clears editing
	this.removeAllListeners_();
	this.corners_ = [];
	this.div_bounds_ = null;
	this.div_editing_ = null;
	this.unloadAllImgs_();
	this.mapAdded_ = false;
}
GroundOverlayEX.prototype['draw'] = GroundOverlayEX.prototype.draw;
GroundOverlayEX.prototype.draw = function() {
	// this gets called whenever the Google Maps framework needs to have the overlay re-drawn (typically 1st time and map zooming);
	// this also gets called when images are swapped due to panning and zooming;
	// hence we always need to translate latlngs to map coordinates
	if (this.displayedElement_ != null) {
 		var overlayProjection = this.getProjection();
		var de = this.displayedElement_;
		if (this.displayMode_ == "Q") {
			// rectangular or non-rectangular latlngQuad method; corners order is BL, BR, TR, TL
			var gmpoint1 = overlayProjection.fromLatLngToDivPixel(this.llq_.getBottomLeft());
			var gmpoint2 = overlayProjection.fromLatLngToDivPixel(this.llq_.getBottomRight());
			var gmpoint3 = overlayProjection.fromLatLngToDivPixel(this.llq_.getTopRight());
			var gmpoint4 = overlayProjection.fromLatLngToDivPixel(this.llq_.getTopLeft());
			var point1 = [];
			point1[0] = Math.round(gmpoint1.x);
			point1[1] = Math.round(gmpoint1.y);
			this.corners_[0] = point1;
			var point2 = [];
			point2[0] = Math.round(gmpoint2.x);
			point2[1] = Math.round(gmpoint2.y);
			this.corners_[1] = point2;
			var point3 = [];
			point3[0] = Math.round(gmpoint3.x);
			point3[1] = Math.round(gmpoint3.y);
			this.corners_[2] = point3;
			var point4 = [];
			point4[0] = Math.round(gmpoint4.x);
			point4[1] = Math.round(gmpoint4.y);
			this.corners_[3] = point4;

			// form a psuedo-bounds for the given lats and lons
			var pbLeft = Math.min(this.corners_[0][0], this.corners_[1][0], this.corners_[2][0], this.corners_[3][0]);
			var pbRight = Math.max(this.corners_[0][0], this.corners_[1][0], this.corners_[2][0], this.corners_[3][0]);
			var pbTop = Math.min(this.corners_[0][1], this.corners_[1][1], this.corners_[2][1], this.corners_[3][1]);
			var pbBottom = Math.max(this.corners_[0][1], this.corners_[1][1], this.corners_[2][1], this.corners_[3][1]);
			var pbCenterX = pbLeft + Math.round((pbRight - pbLeft)/2);
			var pbCenterY = pbTop + Math.round((pbBottom - pbTop)/2);

			// place the not-yet-transformed image into the center of the psuedo-bounds
			var nonBorderLeft = pbCenterX - Math.round(de.clientWidth/2);
			var nonBorderTop = pbCenterY - Math.round(de.clientHeight/2);
			de.style.left = (nonBorderLeft - de.clientLeft) + 'px';
 			de.style.top = (nonBorderTop - de.clientTop) + 'px';

			// perform the transform
			de.style["-webkit-transformOrigin"] = "0 0";	  
			de.style["-ms-transformOrigin"] = "0 0";
			de.style["-o-transformOrigin"] = "0 0";
			de.style.transformOrigin = "0 0";
			this.doQuadrilateralTransform_();

		} else if (this.displayMode_ == "B") {
			// rectangular latlngBox method
 			var sw = overlayProjection.fromLatLngToDivPixel(this.bounds_.getSouthWest());
 			var ne = overlayProjection.fromLatLngToDivPixel(this.bounds_.getNorthEast()); 
			var nonBorderLeft = Math.round(sw.x);
			var nonBorderTop = Math.round(ne.y)	
			var nonBorderWidth = Math.round(ne.x - sw.x);
			var nonBorderHeight = Math.round(sw.y - ne.y);

			// re-size and re-position (non-rotated)
			de.style.left = (nonBorderLeft - de.clientLeft) + 'px';
 			de.style.top = (nonBorderTop - de.clientTop) + 'px';
			de.style.width = nonBorderWidth + 'px';
 			de.style.height = nonBorderHeight + 'px';

			// perform rotation (which will automatically compute Rect LLQ info)
			this.setRotation(this.rotate_);
		}		
		this.displayedElement_.style.opacity = this.opacity_;
		this.doZindex_();
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
	
	if (this.displayedElement_ != null) {
		this.displayedElement_.style.opacity = this.opacity_;
	}
}

////////////////////////
// extended capabilities
// public methods
////////////////////////
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
GroundOverlayEX.prototype['setRotation'] = GroundOverlayEX.prototype.setRotation;
GroundOverlayEX.prototype.setRotation = function(pDegCCW) {
	// pDegCCW: Number=set image rotation in degrees counter-clockwise and perform the rotation; will be ignored for a LatLngQuad-mode
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
	if (this.displayMode_ == "B") {
		this.doPerformRotation_();
		if (this.displayedElement_ != null) {
			this.recordNewRectLLQ_(this.displayedElement_);
			this.recomputeRegionBounds_();
		}
	}
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
	if (this.displayedElement_ != null && (this.shouldClickable_(1) || this.displayMode_ == "Q")) {
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

	if (this.displayedElement_ != null) {
		if (this.shouldClickable_(32) || this.editable_) {
			this.qtyListeners_++; 
			if (this.imageListener1_ == null) { this.imageListener1_ = google.maps.event.addDomListener(this.displayedElement_, "mousedown", function(evt) { GroundOverlayEX_imageMouseDown_(that, evt); }); }
		} else {
			if (this.imageListener1_ != null) { google.maps.event.removeListener(this.imageListener1_); this.imageListener1_ = null; }
		}
		if (this.shouldClickable_(64) || this.editable_) {
			this.qtyListeners_++; 
			if (this.imageListener2_ == null) { this.imageListener2_ = google.maps.event.addDomListener(this.displayedElement_, "mouseup", function(evt) { GroundOverlayEX_imageMouseUp_(that, evt); }); }
		} else {
			if (this.imageListener2_ != null) { google.maps.event.removeListener(this.imageListener2_); this.imageListener2_ = null; }
		}
		if (this.shouldClickable_(1) || this.isEditing_) {
			this.qtyListeners_++; 
			if (this.imageListener3_ == null) { this.imageListener3_ = google.maps.event.addDomListener(this.displayedElement_, "click", function(evt) { GroundOverlayEX_imageClicked_(that, evt); }); }
		} else {
			if (this.imageListener3_ != null) { google.maps.event.removeListener(this.imageListener3_); this.imageListener3_ = null; }
		}
		if (this.shouldClickable_(2) || this.isEditing_) {
			this.qtyListeners_++; 
			if (this.imageListener4_ == null) { this.imageListener4_ = google.maps.event.addDomListener(this.displayedElement_, "dblclick", function(evt) { GroundOverlayEX_imageDoubleClicked_(that, evt); }); }
		} else {
			if (this.imageListener4_ != null) { google.maps.event.removeListener(this.imageListener4_); this.imageListener4_ = null; }
		}
		if (this.shouldClickable_(4) || this.isEditing_) {
			this.qtyListeners_++; 
			if (this.imageListener5_ == null) { this.imageListener5_ = google.maps.event.addDomListener(this.displayedElement_, "rightclick", function(evt) { GroundOverlayEX_imageRightClicked_(that, evt); }); }
		} else {
			if (this.imageListener5_ != null) { google.maps.event.removeListener(this.imageListener5_); this.imageListener5_ = null; }
		}
		if (this.shouldClickable_(8) || this.isEditing_) {
			this.qtyListeners_++; 
			if (this.imageListener6_ == null) { this.imageListener6_ = google.maps.event.addDomListener(this.displayedElement_, "mouseover", function(evt) { GroundOverlayEX_imageMouseOver_(that, evt); }); }
		} else {
			if (this.imageListener6_ != null) { google.maps.event.removeListener(this.imageListener6_); this.imageListener6_ = null; }
		}
		if (this.shouldClickable_(16) || this.isEditing_) {
			this.qtyListeners_++; 
			if (this.imageListener7_ == null) { this.imageListener7_ = google.maps.event.addDomListener(this.displayedElement_, "mouseout", function(evt) { GroundOverlayEX_imageMouseOut_(that, evt); }); }
		} else {
			if (this.imageListener7_ != null) { google.maps.event.removeListener(this.imageListener7_); this.imageListener7_ = null; }
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
}
GroundOverlayEX.prototype.assessRegion_ = function() {
	// this is the main controller of the GOEX; it decides whether to load images, which image, and whether to display
	if (!this.mapAdded_) return;
	if (this.bounds_ == null && this.llq_ == null) return;

	var mapBnds = this.map.getBounds();
	if (mapBnds.intersects(this.regionBounds_)) {

		// this GOEX is in-view (even partially)
		var zoom = this.map.getZoom();
		var r = this.zoomArray_.whichIndexPerZoom(zoom);
		if (r >= 0) {
			// an image at this zoom level is to be displayed
			if (this.imgsLoaded_[r] == 0) {
				// the needed image is not yet loaded; so load it which at callback will re-assess displaying it
				this.doLoadImageNumber_(r);
			} else if (this.imgsLoaded_[r] == 2) {
				// the needed image is already loaded
				this.doDisplayImageNumber_(r);
			}

		} else {
			// at this zoom level, nothing is to be displayed; however leave all images loaded
			this.doDisplayImageNumber_(-1);
			if (this.managerRecommendedLoad_) {
				this.mgrRecommendLoadImage();
				this.managerRecommendedLoad_ = false;
			}
		}
		
	} else {
		// this GOEX is not in-view (not even partially); but we do want to leave nearby image's in-place for awhile
		this.doDisplayImageNumber_(-1);
		if (this.managerRecommendedLoad_) {
			this.mgrRecommendLoadImage();
			this.managerRecommendedLoad_ = false;
		} else {
			// ??? deload images after some time interval or sufficient distance from map display viewport
		}
	}

}
GroundOverlayEX.prototype.doLoadImageNumber_ = function(pIndex) {
	if (this.imgs_[pIndex] == null && this.imgsLoaded_[pIndex] == 0) {
		// image is not yet in-process of being loaded
		var img = document.createElement('img');
		this.imgs_[pIndex] = img;
		img.style.borderStyle = 'solid';
 		img.style.borderWidth = '1px';
		img.style.borderColor = 'Transparent';
 		img.style.position = 'absolute';
 		img.style.width = 'auto';
 		img.style.height = 'auto';
		img.parentGOEX = this;
		img.parentGOEX_index = pIndex;
		img.onerror = function() {
				// remember in a callback "this" = the img object; need to use "this.parentGOEX.*" to access the GroundOverlayEX class
				console.log("GOEX.doLoadImageNumber_: "+this.parentGOEX.id_+" image "+this.parentGOEX_index+" load error: "+this.src); 
			}
		img.onload = function() {
				// this code gets invoked when the image has finally finished loading (and its original width and height are retrieved)
				// remember in a callback "this" = the img object; need to use "this.parentGOEX.*" to access the GroundOverlayEX class
				if (!this.parentGOEX.mapAdded_) {
					// the GOEX was removed from the map in the middle of downloading
					this.parentGOEX.imgsLoaded_[this.parentGOEX_index] = 0;
					this.parentGOEX.imgs_[this.parentGOEX_index] = null;
				} else {
					// continue processing the newly downloaded image
					this.parentGOEX.qtyImgsLoaded_++;
					this.parentGOEX.memoryImgsLoaded_ += (this.width * this.height);
					if (this.parentGOEX.cropping_) {
						if (this.parentGOEX.cropBase_.length > 0) {
							this.parentGOEX.doCropImageNumber_(this.parentGOEX_index);
							this.parentGOEX.assessRegion_();
						} else {
							if (this.src == this.parentGOEX.url_) {
								this.parentGOEX.recordCropBase_(this.width, this.height);
								this.parentGOEX.doCroppingAll_();
								this.parentGOEX.assessRegion_();
							}
						}
					} else { 
						this.parentGOEX.imgsLoaded_[this.parentGOEX_index] = 2;
						this.parentGOEX.assessRegion_();
					}
				}
			}

		// now begin loading the image; the above callback will complete the process once the image has finally loaded
		this.imgsLoaded_[pIndex] = 1;
 		img.src = this.zoomArray_.getUrl(pIndex);
	}
}
GroundOverlayEX.prototype.unloadAllImgs_ = function() {
	// DANGER: ensure doDisplayImageNumber_(-1) has been called first
	for (var i in this.imgs_) {
		this.doUnloadImageNumber_(i);
	}
}
GroundOverlayEX.prototype.doUnloadImageNumber_ = function(pIndex) {
	// however do not unload it if it is actively being displayed or it is actively being downloaded
	if (pIndex != this.imgDisplayed_ && this.imgsLoaded_[pIndex] == 2) {
		this.memoryImgsLoaded_ -= (this.imgs_[pIndex].naturalWidth * this.imgs_[pIndex].naturalHeight);
		this.qtyImgsLoaded_--;
		this.imgsLoaded_[pIndex] = 0;
		this.imgs_[pIndex] = null;
		this.canvases_[pIndex] = null;
	}
}
GroundOverlayEX.prototype.recordCropBase_ = function(pOrigWidth, pOrigHeight) {
	if (this.cropping_) {
		this.cropOrigImgWidth_ = pOrigWidth;
		this.cropOrigImgHeight_ = pOrigHeight;

		var cropXleft_base = 0;
		var cropYtop_base = 0;
		var cropWidth_base = pOrigWidth;
		var cropHeight_base = pOrigHeight;

		// compose the cropBase from the initialization data
		if (this.cropFromLeft_ > 0) {
			if (this.cropFromLeft_ >= this.cropOrigImgWidth_) this.overCropped_ = true;
			cropXleft_base = this.cropFromLeft_; 
		}
		if (this.cropToWidth_ > 0) {
			if (this.cropToWidth_ > (this.cropOrigImgWidth_ - cropXleft_base)) this.overCropped_ = true;
			cropWidth_base = this.cropToWidth_; 
		} else { 
			cropWidth_base = this.cropOrigImgWidth_ - cropXleft_base; 
		}
		if (this.cropFromBottom_ > 0) { 
			if (this.cropFromBottom_ >= this.cropOrigImgHeight_) this.overCropped_ = true;
			cropHeight_base = this.cropOrigImgHeight_ - this.cropFromBottom_; 
		}
		if (this.cropToHeight_ > 0) { 
			cropYtop_base = (cropHeight_base - this.cropToHeight_); 
			if (this.cropToHeight_ > (this.cropOrigImgHeight_ - cropYtop_base)) this.overCropped_ = true;
			cropHeight_base = this.cropToHeight_; 
		}

		this.cropBase_[0] = cropXleft_base;
		this.cropBase_[1] = cropYtop_base;
		this.cropBase_[2] = cropWidth_base;
		this.cropBase_[3] = cropHeight_base;
	}
}
GroundOverlayEX.prototype.doCroppingAll_ = function() {
	for (var i in this.imgs_) {
		if (this.imgs_[i] != null && this.canvases_[i] == null) {
			this.doCropImageNumber_(i);
		}
	}
}
GroundOverlayEX.prototype.doCropImageNumber_ = function(pIndex) {
	if (this.cropping_ && this.cropBase_.length > 0) {
		var workImg = this.imgs_[pIndex];
		workImg.style.visibility = 'hidden';
		var cropXleft = Math.round(this.cropBase_[0] * workImg.width / this.cropOrigImgWidth_);
		var cropYtop = Math.round(this.cropBase_[1] * workImg.height / this.cropOrigImgHeight_);
		var cropWidth = Math.round(this.cropBase_[2] * workImg.width / this.cropOrigImgWidth_);
		var cropHeight = Math.round(this.cropBase_[3] * workImg.height / this.cropOrigImgHeight_);

		if (cropXleft >= workImg.width || cropYtop >= workImg.height) { this.overCropped_ = true; }
		if (cropWidth > (workImg.width - cropXleft) || cropHeight > (workImg.height - cropYtop)) { this.overCropped_ = true; }
		// note to handle issues with browser bugs auto-clipping transformation of very large images, a border MUST be present at all times (though transparent).
		var canvas = document.createElement('canvas');
		this.canvases_[pIndex] = canvas;
		canvas.width = cropWidth;
		canvas.height = cropHeight;
		canvas.style.borderStyle = 'solid';
 		canvas.style.borderWidth = '1px';
		canvas.style.borderColor = 'Transparent';
		canvas.style.position = "absolute";
		canvas.parentGOEX = this;
		canvas.parentGOEX_index = pIndex;
		ctx = canvas.getContext('2d');

		// note: occasionally the canvas drawImage will fail with "NS_ERROR_NOT_AVAILABLE" because Firefox stupidly triggers on the OnLoad callback
		// BEFORE the image has actually downloaded.  A bug identified in 2010 and 5 years later never fixed.
		// see: https://bugzilla.mozilla.org/show_bug.cgi?id=574330
		ctx.drawImage(workImg, cropXleft, cropYtop, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

		this.imgsLoaded_[pIndex] = 2;
	}
}
GroundOverlayEX.prototype.doDisplayImageNumber_ = function(pIndex) {
	if (pIndex >= 0) {
		if (this.mapAdded_ && pIndex != this.imgDisplayed_) {

			// display the indicated image; first remove any existing displayed image
			if (this.displayedElement_ != null) { 
				this.displayedElement_.parentNode.removeChild(this.displayedElement_); 
			}

			// choose either the image or the canvas to display
			if (this.cropping_ && this.canvases_[pIndex] != null) { this.displayedElement_ = this.canvases_[pIndex]; }
			else { this.displayedElement_ = this.imgs_[pIndex]; }
			
			// Add the displayed element to the "overlayMouseTarget" pane of the map so we get mouse events if editing mode is enabled;
			// then activate proper listeners
 			var panes = this.getPanes();
			panes.overlayMouseTarget.appendChild(this.displayedElement_);
			this.emplaceProperListeners_();

			// now force a draw and re-enable editing if supposed to
			this.imgDisplayed_ = pIndex;
			this.draw();
		}
	} else {
		// nothing is supposed to be displayed
		if (this.displayedElement_ != null) {
			this.imgDisplayed_ = -1;
			this.displayedElement_.parentNode.removeChild(this.displayedElement_); 
			this.displayedElement_ = null;
		}
		this.emplaceProperListeners_();
	}
}
GroundOverlayEX.prototype.doZindex_ = function() {
	if (this.displayedElement_ != null) {
		var z = this.getEffectiveZindex();
		this.displayedElement_.style.zIndex = String(z);
	}
}
GroundOverlayEX.prototype.doPerformRotation_ = function() {
	if (this.displayMode_ == "B" && this.displayedElement_ != null) {
		var rot = -(this.rotate_);
		var rotStr = 'rotate(' + rot + 'deg)';
		this.displayedElement_.style["-webkit-transform"] = rotStr;	  
		this.displayedElement_.style["-ms-transform"] = rotStr;
		this.displayedElement_.style["-o-transform"] = rotStr;
		this.displayedElement_.style.transform = rotStr;
	}
}
GroundOverlayEX.prototype.doQuadrilateralTransform_ = function() {
	// requires that this.corners_ be properly set with x,y points of the BL, BR, TR, TL corners;
	// remember this.corners_ does NOT include borders present during editing!
	// see: http://codepen.io/fta/pen/ifnqH/
	// see: http://bl.ocks.org/mbostock/10571478
	// see: http://quabr.com/27209058/perspective-transformation-only-working-on-svg-tag-and-not-g-or-image

	// get the original (non-transformed) position of the img or canvas
	var de = this.displayedElement_;
	var left = de.offsetLeft + de.clientLeft;
	var top = de.offsetTop + de.clientTop;
	var width = de.clientWidth;
	var height = de.clientHeight;

	// normalize both the original position and the desired position to the left,top of the original position
	// from and to order: TL, BL, TR, BR
	var from = [];
	from.push({ x: 0, y: 0});
	from.push({ x: 0, y: height});
	from.push({ x: width, y: 0});
	from.push({ x: width, y: height});

	var to= [];
	to.push({ x: this.corners_[3][0] - left, y: this.corners_[3][1] - top});
	to.push({ x: this.corners_[0][0] - left, y: this.corners_[0][1] - top});
	to.push({ x: this.corners_[2][0] - left, y: this.corners_[2][1] - top});
	to.push({ x: this.corners_[1][0] - left, y: this.corners_[1][1] - top});

	// construct A and b in preparation for the numeric.solve function
	var i;
	var A = [];
	for (i = 0; i < 4; i++) {
      		A.push([from[i].x, from[i].y, 1, 0, 0, 0, -from[i].x * to[i].x, -from[i].y * to[i].x]);
     		A.push([0, 0, 0, from[i].x, from[i].y, 1, -from[i].x * to[i].y, -from[i].y * to[i].y]);
    	}

	var b = [];
    	for (i = 0; i < 4; i++) {
      		b.push(to[i].x);
      		b.push(to[i].y);
    	}

	// compute the transform parameters
	var h = numeric.solve(A, b);
	var H = [ h[0], h[3], 0, h[6], h[1], h[4], 0, h[7], 0, 0, 1, 0, h[2], h[5], 0, 1 ];
	var ts = "matrix3d(" + H.join(", ") + ")";
			  
	de.style["-webkit-transform"] = ts;	  
	de.style["-ms-transform"] = ts;
	de.style["-o-transform"] = ts;
	de.style.transform = ts;
}
GroundOverlayEX.prototype.recomputeRegionBounds_ = function() {
	// the this.llq_ is available to create bounding boxes
	if (this.regionBoundsOrig_ == null) {
		// no regionBounds was set by the configuration, so the new bounds is just a simple recompute
		this.regionBounds_ = this.llq_.getBoundsBox();
	} else {
		// a regionBounds was defined by the configuration, so need to adapt that
		this.regionBounds_ = this.regionBoundsOrig_.extend(this.llq_.getBottomLeft());
		this.regionBounds_ = this.regionBounds_.extend(this.llq_.getBottomRight());
		this.regionBounds_ = this.regionBounds_.extend(this.llq_.getTopRight());
		this.regionBounds_ = this.regionBounds_.extend(this.llq_.getTopLeft());
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
GroundOverlayEX.prototype.recordNewRectLLQ_ = function(pElement) {
	var overlayProjection = this.getProjection();
	var centerX = (pElement.offsetLeft + pElement.clientLeft) + (pElement.clientWidth / 2);
	var centerY = (pElement.offsetTop + pElement.clientTop) + (pElement.clientHeight / 2);

	// calculate the rectangular rotated latlngQuad; order is: BL, BR, TR, TL
	var posX = (pElement.offsetLeft + pElement.clientLeft);
	var posY = (pElement.offsetTop + pElement.clientTop)  + pElement.clientHeight;
	var rpoint = this.adjustForRotation_(centerX, centerY, posX, posY);
	this.corners_[0] = rpoint;
	var gmpoint = new google.maps.Point(rpoint[0], rpoint[1]);
 	var blLatlng = overlayProjection.fromDivPixelToLatLng(gmpoint);

	posX = (pElement.offsetLeft + pElement.clientLeft) + pElement.clientWidth;
	//posY = (pElement.offsetTop + pElement.clientTop)  + pElement.clientHeight;
	rpoint = this.adjustForRotation_(centerX, centerY, posX, posY);
	this.corners_[1] = rpoint;
	gmpoint = new google.maps.Point(rpoint[0], rpoint[1]);
 	var brLatlng = overlayProjection.fromDivPixelToLatLng(gmpoint);

	//posX = (pElement.offsetLeft + pElement.clientLeft) + pElement.clientWidth;
	posY = (pElement.offsetTop + pElement.clientTop);
	rpoint = this.adjustForRotation_(centerX, centerY, posX, posY);
	this.corners_[2] = rpoint;
	gmpoint = new google.maps.Point(rpoint[0], rpoint[1]);
 	var trLatlng = overlayProjection.fromDivPixelToLatLng(gmpoint);

	posX = (pElement.offsetLeft + pElement.clientLeft);
	//posY = (pElement.offsetTop + pElement.clientTop);
	rpoint = this.adjustForRotation_(centerX, centerY, posX, posY);
	this.corners_[3] = rpoint;
	gmpoint = new google.maps.Point(rpoint[0], rpoint[1]);
 	var tlLatlng = overlayProjection.fromDivPixelToLatLng(gmpoint);

	if (this.llq_ != null) this.llq_.destroy();
	this.llq_ = null;
	this.llq_ = new LatLngQuad(blLatlng, brLatlng, trLatlng, tlLatlng);
	this.llqType_ = "R";
}
GroundOverlayEX.prototype.isAtWhichEdgePoint_ = function(evt) {
	// handles:	except +/- 10 of corner: 1= left edge, 2=right edge, 3=top edge, 4=bottom edge
	//		5=BL corner, 6=BR corner, 7=TR corner, 8=TL corner
	var edge = 0;
	de = this.displayedElement_;
	if (evt.layerX <= de.clientLeft + 2) {
		if (evt.layerY <= de.clientTop + 20) edge = 8;
		else if (evt.layerY >= de.offsetHeight - de.clientTop - 20) edge = 5;
		else edge = 1;
	}
	else if (evt.layerX >= de.offsetWidth - de.clientLeft - 2) {
		if (evt.layerY <= de.clientTop + 20) edge = 7;
		else if (evt.layerY >= de.offsetHeight - de.clientTop - 20) edge = 6;
		else edge = 2;
	}
	else if (evt.layerY <= de.clientTop + 2) {
		if (evt.layerX <= de.clientLeft + 20) edge = 8;
		else if (evt.layerX >= de.offsetWidth - de.clientTop - 20) edge = 7;
		else edge = 3;
	}
	else if (evt.layerY >= de.offsetHeight - de.clientTop - 2) {
		if (evt.layerX <= de.clientLeft + 20) edge = 5;
		else if (evt.layerX >= de.offsetWidth - de.clientTop - 20) edge = 6;
		else edge = 4;
	}
	return edge;
}
GroundOverlayEX.prototype.shouldClickable_ = function(pEventNumber) {
	// this.clickableEvents_: 1=click, 2=dblclick, 4=rightclick, 8=mouseover, 16=mouseout, 32=mousedown, 64=mouseup
	if (this.clickable_ && !this.isEditing_ && this.map.getZoom() >= this.clickableAtZoom_) {
		var b = this.clickableEvents_ & pEventNumber;
		if (b != 0)  return true;
	}
	return false;
}
GroundOverlayEX.prototype.getEventInfo_ = function(pMouseEvent) {
	var retInfo = [];
	retInfo[0] = -1;
	retInfo[1] = -1;
	if (this.zoomArray_.length() > 1) {	
		if (this.displayedElement_ != null && this.origImgWidth_ > 0 && this.origImgHeight_ > 0) {
			retInfo[0] = Math.round(pMouseEvent.layerX * (this.origImgWidth_ / this.displayedElement_.width));
			retInfo[1] = Math.round(pMouseEvent.layerY * (this.origImgHeight_ / this.displayedElement_.height));
		}
	} else {
		retInfo[0] = pMouseEvent.layerX;
		retInfo[1] = pMouseEvent.layerY;
	}

	// need to use ContainerPixel in this case since PageX and PageY are in the context of the entire page, not just the Map Div
	var overlayProjection = this.getProjection();
	var screenPoint = new google.maps.Point(pMouseEvent.pageX, pMouseEvent.pageY);
	var pointLatLon = overlayProjection.fromContainerPixelToLatLng(screenPoint);
	retInfo[2] = pointLatLon.lat();
	retInfo[3] = pointLatLon.lng();
	return retInfo;
}

// for the following listener callback functions:
//   this = DOM root window
//   GOobj = GroundOverlayEX
//   evt = undefined
function GroundOverlayEX_mapDrag_(GOobj) {
	if (GOobj.clickable_) { this.clickStarted_ = false; }
	if (GOobj.displayedElement_ != null && GOobj.displayMode_ == "Q") {
		// these three lines are a kludge to force the browser to redraw the displayedElement 
		// to fix the fact that transform does not render portions that may be outside the parent map window
		GOobj.displayedElement_.style.display = "none";
		var height = GOobj.displayedElement_.offsetHeight;
		GOobj.displayedElement_.style.display = "";
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
//   evt = DOM MouseEvent; layer* is point within the displayed element's coord space; 
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
}
function GroundOverlayEX_imageMouseOut_(GOobj, evt) {
	// this happens only once when the non-clicked or clicked cursor first leaves the displayed element;
	// however when resizing or rotating, the cursor may pass out of the bounds over and over
	if (GOobj.shouldClickable_(16)) {
		var info = GOobj.getEventInfo_(evt);
		google.maps.event.trigger(GOobj, "mouseout", evt, GOobj, info[0], info[1], info[2], info[3]);
		if (GOobj.manager_ != null) { google.maps.event.trigger(GOobj.manager_, "mouseout", evt, GOobj, info[0], info[1], info[2], info[3]); }
	}
}
function GroundOverlayEX_imageMouseDown_(GOobj, evt) {
	// this happens only once when the mouse button is pressed and held over the displayed element
	if (GOobj.shouldClickable_(32)) { 
		var info = GOobj.getEventInfo_(evt);
		google.maps.event.trigger(GOobj, "mousedown", evt, GOobj, info[0], info[1], info[2], info[3]);
		if (GOobj.manager_ != null) { google.maps.event.trigger(GOobj.manager_, "mousedown", evt, GOobj, info[0], info[1], info[2], info[3]); }
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
	if (evt.button == 2) {
		// was a right click
			if (GOobj.clickable_ && !GOobj.isEditing_) {
				var info = GOobj.getEventInfo_(evt);
				google.maps.event.trigger(GOobj, "rightclick", evt, GOobj, info[0], info[1], info[2], info[3]); 
				if (GOobj.manager_ != null) { google.maps.event.trigger(GOobj.manager_, "rightclick", evt, GOobj, info[0], info[1], info[2], info[3]); }
			}
	}
}


//////////////////////////////////////////////////////////////////////////////
// ZoomArray code including ZoomEntry* classes 
//////////////////////////////////////////////////////////////////////////////

// Google Maps V3 Zoom levels to equivalent Google Earth altitudes
// zoom levels range from 0 to 22
var ZoomEntryZoomEarthZooms_m = [ 30000000, 24000000, 18000000, 10000000, 4000000, 1900000, 1100000, 550000, 280000, 170000, 82000, 38000, 19000, 9200, 4300, 2000, 990, 570, 280, 100, 36, 12, 0 ];
var ZoomEntryZoomEarthZooms_ft = [ 98425197, 78740157, 59055118, 32808399, 13123360, 6233596, 3608924, 1804462, 918635, 557743, 269029, 124672, 62336, 30184, 14108, 6562, 3248, 1870, 919, 328, 118, 39, 0 ];

ZoomArray.prototype = new google.maps.MVCObject();
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
	this.objArray_ = [];
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
ZoomEntryZoom.prototype = new google.maps.MVCObject();
window['ZoomEntryZoom'] = ZoomEntryZoom;
/**
 * @constructor
 */
function ZoomEntryZoom(mapZoomLow, mapZoomHigh, url) {
	this.zoomLow_ = mapZoomLow;
	this.zoomHigh_ = mapZoomHigh;
	this.url_ = url;
}
ZoomEntryAlt_ft.prototype = new google.maps.MVCObject();
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
ZoomEntryAlt_m.prototype = new google.maps.MVCObject();
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
}
LatLngQuad.prototype['destroy'] = LatLngQuad.prototype.destroy;
LatLngQuad.prototype.destroy = function() {
	this.LatLngs_[0] = null;
	this.LatLngs_[1] = null;
	this.LatLngs_[2] = null;
	this.LatLngs_[3] = null;
	this.valid_ = false;
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
LatLngQuad.prototype['inBoundsBox'] = LatLngQuad.prototype.inBoundsBox;
LatLngQuad.prototype.inBoundsBox = function(pLatLng) {
	// ??? this code does not support spanning the international date line
	var result = false;
	var lat = pLatLng.lat();
	var lng = pLatLng.lng()
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
	if (this.mgrListener1_ != null) google.maps.event.removeListener(this.mgrListener1_);

	for (var i in this.indexOfGOEXs_) {
		if (this.indexOfGOEXs_[i] != null) {
			this.indexOfGOEXs_[i].destroy();
			this.indexOfGOEXs_[i] = null;
			this.indexOfMapEnabled_[i] = false;
		}
	}

	this.mapBoundsPlace_ = null;
	this.mapBoundsLoad_ = null;
	this.indexOfMapEnabled_ = [];
	this.indexOfLoadRecommend_ = [];
	this.map_ = null;
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
	var qtys = [];
	qtys[0] = this.indexOfGOEXs_.length
	qtys[1] = 0;
	qtys[2] = 0;
	qtys[3] = 0;
	qtys[4] = 0;
	qtys[5] = 0;
	for (var i in this.indexOfGOEXs_) {
		if (this.indexOfMapEnabled_[i]) qtys[1]++;
		qtys[2] += this.indexOfGOEXs_[i].qtyListeners_;
		qtys[3] += this.indexOfGOEXs_[i].qtyImgsLoaded_;
		qtys[4] += this.indexOfGOEXs_[i].memoryImgsLoaded_;
		if (this.indexOfGOEXs_[i].displayedElement_ != null) qtys[5]++;
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
