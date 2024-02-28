var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Err } from "./Err.js";
import { Check } from "./Check.js";
//. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
export class Region {
    constructor(name = "", imageLoc = "", x = 0, y = 0, w = -1, // -1 here implies we resize based on image
    h = -1, // -1 here implies we resize base on image) 
    parent) {
        this._name = name;
        this._parent = parent;
        this._imageLoc = imageLoc;
        // if either of the sizes is -1, we set to resize based on the image
        this._resizedByImage = ((w < 0) || (h < 0));
        // -1 size defaults to 0 (but replaced on load)
        w = (w < 0) ? 0 : w;
        h = (h < 0) ? 0 : h;
        this._x = x;
        this._y = y;
        this._w = w;
        this._h = h;
        // start the image loading;  this.damage() will be called asynchonously 
        // when that is complete
        this._loaded = false;
        this._loadError = false;
        this._startImageLoad();
    }
    // Construct a Region from a Region_json object, checking all the parts (since data 
    // coming from json parsing lives in javascript land and may not actually be typed
    // at runtime as we think/hope it is).
    static fromJson(reg, parent) {
        var _a, _b, _c, _d, _e;
        const name = reg.name;
        const x = Check.numberVal((_a = reg.x) !== null && _a !== void 0 ? _a : 0, "Region.fromJson{x:}");
        const y = Check.numberVal((_b = reg.y) !== null && _b !== void 0 ? _b : 0, "Region.fromJson{y:}");
        const w = Check.numberVal((_c = reg.w) !== null && _c !== void 0 ? _c : -1, "Region.fromJson{w:}");
        const h = Check.numberVal((_d = reg.h) !== null && _d !== void 0 ? _d : -1, "Region.fromJson{h:}");
        const imageLoc = Check.stringVal((_e = reg.imageLoc) !== null && _e !== void 0 ? _e : "", "Region.fromJson{imageLoc:}");
        return new Region(name, imageLoc, x, y, w, h, parent);
    }
    get x() { return this._x; }
    set x(v) {
        // **** YOUR CODE HERE ****
        this._x = v;
        // Declare damage to update the display
        this.damage();
    }
    get y() { return this._y; }
    set y(v) {
        // **** YOUR CODE HERE ****
        this._y = v;
        // Declare damage to update the display
        this.damage();
    }
    get w() { return this._w; }
    set w(v) {
        // **** YOUR CODE HERE ****
        this._w = v;
        // Declare damage to update the display
        this.damage();
    }
    get h() { return this._h; }
    set h(v) {
        // **** YOUR CODE HERE ****
        this._h = v;
        // Declare damage to update the display
        this.damage();
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
    // Size of this object considered as one value
    get size() {
        return { w: this.w, h: this.h };
    }
    set size(v) {
        if ((v.w !== this._w) || (v.h !== this._h)) {
            this._w = v.w;
            this._h = v.h;
            this.damage();
        }
    }
    get name() { return this._name; }
    get parent() { return this._parent; }
    set parent(v) {
        // **** YOUR CODE HERE ****
        this._parent = v;
        // Declare damage to update the display
        this.damage();
    }
    get imageLoc() { return this._imageLoc; }
    set imageLoc(v) {
        if (v !== this._imageLoc) {
            this._imageLoc = v;
            this._startImageLoad();
        }
    }
    get loaded() { return this._loaded; }
    get loadError() { return this._loadError; }
    get resizedByImage() { return this._resizedByImage; }
    // Internal method to resize this region based on its current image.  If this 
    // region is not set to be resized by its image, or the image is not loaded,
    // this does nothing.
    _resizeFromImage() {
        if (this.resizedByImage && this._loaded && this.image) {
            this.size = { w: this.image.width, h: this.image.height };
        }
    }
    get image() { return this._image; }
    //-------------------------------------------------------------------
    // Methods
    //-------------------------------------------------------------------
    // Perform a pick test indicating whether the given position (expressed in the local
    // coordinates of this object) should be considered "inside" or "over" this region.
    pick(localX, localY) {
        // **** YOUR CODE HERE ****
        // Return true if the given position is within the bounds of this region
        var FSM_x = 0;
        var FSM_y = 0;
        if (this._parent && this._parent.parent) {
            FSM_x = this._parent.parent.x;
            FSM_y = this._parent.parent.y;
        }
        return localX >= this._x + FSM_x && localX <= this._x + FSM_x + this._w
            && localY >= this._y + FSM_y && localY <= this._y + FSM_y + this._h;
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Draw the image for this region using the givn drawing context.  The context 
    // should be set up in the local coordinate system of the region (so 0,0 appears
    // at this.x, this.y in the parent canvas).  If the image to be drawn is empty or
    // not yet loaded, or had an error loading, then drawing of the image will not
    // be attempted.  If the showDebugFrame parameter is passed true, a frame is drawn
    // around the (input) bounds of the region for debugging purposes.
    draw(ctx, showDebugFrame = false) {
        // if we have a valid loaded image, draw it
        var FSM_x = 0;
        var FSM_y = 0;
        if (this._parent && this._parent.parent) {
            FSM_x = this._parent.parent.x;
            FSM_y = this._parent.parent.y;
            // console.log(FSM_x, FSM_y)
        }
        if (this.loaded && !this.loadError && this.image) {
            // **** YOUR CODE HERE ****
            // Draw the image for this region using the given drawing context
            if (this.loaded && !this.loadError && this.image) {
                ctx.drawImage(this.image, this.x + FSM_x, this.y + FSM_y, this.w, this.h);
            }
        }
        //draw a frame indicating the (input) bounding box if requested
        if (showDebugFrame) {
            ctx.save();
            ctx.strokeStyle = 'black';
            ctx.strokeRect(this.x, this.y, this.w, this.h);
        }
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Declare that something about this region which could affect its drawn appearance
    // has changed (e.g., the image or position has changed).  This passes this image
    // notification to its parent FSM which eventually results in a redraw.
    damage() {
        // **** YOUR CODE HERE ****
        if (this._parent) {
            this._parent.damage();
        }
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Asynchronous method to start loading of the image for this region.  This 
    // assumes the _imageLoc property is set up with the location of the image to load 
    // and that the object is otherwise initialized.  It will start the process of loading 
    // the desired image and then immediately return, having set up follow-on actions 
    // to complete the bookkeeping for loading process and decare damage, once the image
    // has actually been loaded.  Entities which wish to draw with the image should 
    // check the loaded property of the region.  If that is false, the image drawing 
    // should be skipped.  Once the image has actually been loaded, that property will
    // be reset and damage will be declared to cause a redraw.  Similarly, the loadError
    // property should be checked.  If a loaded image has loadError true, then the image
    // was unable to be loaded from the designated source.  In that case the it is likely 
    // that drawing code should substitute some type of "broken" indicator.  Note that 
    // images are cached based on their imageLoc string so multiple calls to this method
    // requesting an image from the same location will only result in one remote load
    // request.  Cached images will be available immediately upon return from this method.
    // However, images which fail to load will be marked as such in the cache and will 
    // never subsequently load.  
    _startImageLoad() {
        return __awaiter(this, void 0, void 0, function* () {
            // handle empty image case
            if (this.imageLoc === "") {
                this._image = undefined;
                this._loaded = true;
                this._loadError = false;
                this._resizeFromImage();
                this.damage();
                return;
            }
            // try to get the image from the cache
            if (Region._imageIsCached(this.imageLoc)) {
                this._image = Region._imageFromCache(this.imageLoc);
                this._loaded = true;
                this._loadError = false;
                this._resizeFromImage();
                this.damage();
                return;
            }
            // create a new image object and try to load it
            this._image = new Image();
            if (this._image) {
                const img = this._image;
                this._loaded = false;
                this._loadError = false;
                yield new Promise((resolve, reject) => {
                    // set load callbacks
                    img.onload = () => {
                        resolve(this._image);
                        this._loaded = true;
                        this._resizeFromImage();
                    };
                    img.onerror = () => {
                        reject(this._image);
                        this._loadError = true;
                        this._loaded = true;
                        Err.emit(`Load of image from ${this.imageLoc} failed`);
                    };
                    // loading process is started by assigning to img.src
                    img.src = this._imageLoc;
                });
            }
            // once we are finally loaded (or failed), cache the image
            Region._cacheImage(this.imageLoc, this.loadError ? undefined : this.image);
            // pass damage up to cause a redraw with the new image
            this.damage();
        });
    }
    // Indicate if the given image (represented by its location) is in the cache
    static _imageIsCached(imageLoc) {
        return Region._imageCache.has(imageLoc);
    }
    // Retrieve an image from the cache, or return undefined if the image is not 
    // cached.
    static _imageFromCache(imageLoc) {
        return Region._imageCache.get(imageLoc);
    }
    // Put an image in the cache keyed by its location
    static _cacheImage(imageLoc, img) {
        Region._imageCache.set(imageLoc, img);
    }
    //-------------------------------------------------------------------
    // Debugging Support
    //-------------------------------------------------------------------
    // Create a short human readable string representing this object for debugging
    debugTag() {
        return `Region(${this.name})`;
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Create a human readable string displaying this object for debugging purposes
    debugString(indent = 0) {
        let result = "";
        const indentStr = '  '; // two spaces per indent level
        // produce the indent
        for (let i = 0; i < indent; i++)
            result += indentStr;
        result += `Region(${this.name} (${this.x},${this.y},${this.w},${this.h}) `;
        result += `"${this.imageLoc}"`;
        if (this.loaded)
            result += " loaded";
        if (this.loadError)
            result += " err";
        if (!this.parent)
            result += " no parent";
        if (!this.image)
            result += " no image";
        result += ")";
        return result;
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Log a human readable string for this object to the console
    dump() {
        console.log(this.debugString());
    }
} // end class Region
//-------------------------------------------------------------------
// (Static) Image cache methods
//-------------------------------------------------------------------
// Map used to cache images across all regions of all FSMs 
Region._imageCache = new Map;
//===================================================================
//# sourceMappingURL=Region.js.map