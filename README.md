# GroundOverlayEX
An extended GroundOverlay class for Google Maps VPI V3.

GroundOverlayEX (GOEX) class offers nearly all the features in the *KML* definition of a GroundOverlay [https://developers.google.com/kml/documentation/kmlreference#groundoverlay], including quadrilateral (non-rectangular) display of images via a LatLngQuad (in addition to display via a LatLngBox), image rotation when using LatLngBox, optional pre-cropping of the source image.  It is designed to be used with Google Maps API V3.

This class also includes an optional manager class that can manage a collection of GroundOverlayEX objects to offer:  single-point-of-events listening, GOEX memory management (GOEXs that are significantly offscreen are not loaded and managed by Google Maps), single-point-of-opacity control.

The class also offers an optional image size and placement editing mode to allow a human to optimize placement of an image (either as a rectangular/rotated LatLngBox or as a non-rectangular LatLngQuad).  Support for the editing mode is provided is a separate and larger .js file.  The GroundOverlayEX.js file provides all capabilities except editing, while the GroundOverlayEXeditable.js files provides all the capabilities and includes editing.  GroundOverlayEX.js is a subset of GroundOverlayEXeditable.js (and the GroundOverlayEXeditable.js is the primary codebase).

The class does NOT store nor retrieve necessary configuration information (e.g. image URL, latitudes & longitudes); this information is assumed to be in some external respository.  Code external to this class must fetch such information, and instanciate the GroundOverlayEX class with at least a minimal set of information.  If the optional image size/placement editing mode is utilized, external code to the class is responsible to use various class get* methods to extract the results of the edit, and store that revised data in the external repository.  This class also does not initialize or configure the Google Map; external code to the class must perform those activities.

It is possible that a future Google Maps API may offer some or all of these capabilities.  This class offers an interim capability.  It should be possible to adapt the class to other map frameworks.  That may be a future task.

The documentation.txt file contains the API definition of the class, plus some examples.

Attribution: Mike Maschino, Google Maps API
License: MIT License (see License.txt)
