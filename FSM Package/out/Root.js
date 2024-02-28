import { Err } from "./Err.js";
//===================================================================
// Class for a root object which manages the connection with with the underlying 
// HTML canvas and performs other global tasks (like invoking redraws) for the system.
// This object maintains a list of child (FSMInteractor) objects which it collects
// damage notifications from, arranges to be drawn, and dispatches input to.
//===================================================================
export class Root {
    constructor(canvasID) {
        // Whether we request extra debugging output when our child objects are 
        // drawn.  This defaults to false, but setting it true will provide additional
        // output that makes understanding and debugging FSM behavior easier (but is not 
        // an end-user suitable display).
        this._doDebugOutput = false;
        //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
        // Bookkeeping of whether damage has been declared but not responed to with a 
        // redraw, and whether we are currently batching up damage notifications (as opposed
        // to doing immediate redraws when damage occurs).
        this._damaged = false;
        this._batchingDamage = false;
        // Bookkeeping for tracking the state of which mouse buttons were down at the last 
        // MouseEvent event.  We are currently only interested in the primary button, so this
        // is masked to just include bit #0.  We use this to catch instances where the 
        // mouse buttion is release outside the canvas, so we never hear about it.  
        // Specifically, at the point the locator reenters the canvas area, if this indicates 
        // that the button was down before, but is up now without us having seen the 
        // corresponding up event, we know we lost (at least one) up event and can generate 
        // one.
        this._lastButtonsState = 0;
        this._children = [];
        // get the canvas object we will draw on and set our w/h to match that
        this._canvasContext = this._getCanvasContext(canvasID);
        this._owningCanvas = this._canvasContext.canvas;
        // setup canvas input callbacks
        this._setupCanvasInputHandlers();
    }
    get children() { return this._children; }
    // Add a child object to our child list, linking to us as parent appropriately.
    addChild(newChild) {
        if (this.children.includes(newChild))
            return;
        this._children.push(newChild);
        newChild.parent = this;
    }
    // Remove a child object from our child list (unlinking us as parent)
    removeChild(child) {
        const indx = this.children.indexOf(child);
        if (indx >= 0)
            this._children.splice(indx, 1);
        child.parent = undefined;
    }
    get owningCanvas() { return this._owningCanvas; }
    get canvasContext() { return this._canvasContext; }
    get doDebugOutput() { return this._doDebugOutput; }
    set doDebugOutput(v) { this._doDebugOutput = v; }
    //-------------------------------------------------------------------
    // Methods 
    //-------------------------------------------------------------------
    // Perform of redraw across all our child object using the previously established
    // drawing context object for the HTML canvas object we are associated with.
    // This begins work by clearing the entire canvas.  The for each child object this 
    // saves the state of the drawing context, puts it in the child coordinate system,
    // draws the child, and then restors the context.
    _redraw() {
        const saveBatching = this._batchingDamage;
        this._batchingDamage = true;
        try {
            // **** YOUR CODE HERE ****
            // Clear the canvas
            if (this._canvasContext) {
                this._canvasContext.clearRect(0, 0, this._canvasContext.canvas.width, this._canvasContext.canvas.height);
            }
            // Iterate through each child object and draw it
            for (const child of this._children) {
                if (this._canvasContext) {
                    // Save the state of the drawing context
                    this._canvasContext.save();
                    child.draw(this._canvasContext, this.doDebugOutput);
                }
            }
            // currently, for ease of debugging, we let exceptions propogate out from this 
            // redraw (and typically all the out of our code).  this will basically shut 
            // down the whole system and preclude further action.  if recovery from 
            // exceptions is desired instead(probably a good idea for system behavior as 
            // seen by end users, but less so for debugging/testings), a catch should be 
            // placed here (e.g., like  the one commented out below) to swallow (but 
            // hopefully report) exceptions that are propogated out to this point.
        }
        catch (exception) {
            Err.warning("Exception captured and suppressed during redraw.  Pressing ahead...");
        }
        finally {
            this._batchingDamage = saveBatching;
            this._damageResponse();
        }
    }
    // Declare that something has changed that may require that the display be 
    // redrawn.  Depending on the current setting of the internal _batchingDamage
    // flag, the redraw to remove damage may be done immediately, or damage may be 
    // accumulated and the redraw done later.  By default, _batchingDamage is false,
    // leading to immediate redraws.  This is appropriate for damaged caused by 
    // asynchronous loading, because  there isn't an obvious point in program flow
    // that will be known to occur without delay when the batch could be "released" and
    // the redraw performed.  However, the system will temporarily turn on batching 
    // during redraw (as we shouldn't start a new redraw in the middle of an existing
    // one). The system will also temporarily turn on batching during input dispatch
    // (since we know the input is the driving factor behind changes and multiple are
    // likely to occur during one round of dispatch).  After each redraw or input
    // dispatch round, the _batchingDamage setting is restored (typically back to false)
    // and if it becomes false, a redraw to address the damage is performed at that point.
    damage() {
        this._damaged = true;
        this._damageResponse();
    }
    // Produce a possible response to current or accumulated damage.  If we are not 
    // currently batching damage requests (this._batchingDamage === false),  and 
    // damage has been declared, this will cause an immediate redraw. Otherwise, this
    // method does nothing.
    _damageResponse() {
        if (this._damaged && !this._batchingDamage) {
            this._damaged = false;
            this._redraw();
        }
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Do the work needed to set up set up the event handlers on the associated HTML 
    // canvas that we will need (onmousedown, onmousemobe, and onmouseup).  All the 
    // handlers end up calling this._handleCanvaseEvent().
    _setupCanvasInputHandlers() {
        // set event handlers (using arrow functions so "this" is captured correctly)
        this.owningCanvas.onmousedown = (evt) => { this._handleCanvasEvent(evt); };
        this.owningCanvas.onmousemove = (evt) => { this._handleCanvasEvent(evt); };
        this.owningCanvas.onmouseup = (evt) => { this._handleCanvasEvent(evt); };
    }
    // Handler that takes iput events from the canvas object.  These get delivered 
    // as a simplified form of event to each child object.  We also do extra tracking 
    // to catch mouseup events which are otherwise lost becasue they happened outside the
    // canvas, and create an extra event to substitute for them when we re-enter the 
    // canvas.
    _handleCanvasEvent(evt) {
        const saveBatching = this._batchingDamage;
        this._batchingDamage = true;
        // monitor buttons looking for lost up events that happened outside the canvas
        // mask those buttons because we are only interested in the main button
        const newButtonsState = evt.buttons & (1 << 0);
        // button was down, and now is up
        if (this._lastButtonsState === 1 && newButtonsState === 0) {
            // unless this is accounted for by this event, we lost the up somewhere
            if (!(evt.type === 'mouseup' && evt.button === 0)) {
                // make a new up event as a copy of our event
                const missingEvt = new MouseEvent('mouseup', evt);
                // and dispatch it to all children (in reverse of drawn order)
                for (let chIndx = this.children.length - 1; chIndx >= 0; chIndx--) {
                    this._dispatchToChild(missingEvt, this.children[chIndx]);
                }
            }
        }
        // update our tracking
        this._lastButtonsState = evt.buttons & (1 << 0);
        // dispatch the event to each child object (in reverse of drawn order)
        for (let chIndx = this.children.length - 1; chIndx >= 0; chIndx--) {
            this._dispatchToChild(evt, this.children[chIndx]);
        }
        this._batchingDamage = saveBatching;
        this._damageResponse();
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Dispatch a simplified form of event to one child object.  Simplified events
    // are of three types press, move, and release, where press and release are of the 
    // primary locator button only.  Simplified events are represented by an event 
    // type string and a location (expressed in the coordinates of the child being 
    // dispatched to).
    _dispatchToChild(evt, toChild) {
        // get the position in child's coordinates
        const childX = evt.offsetX - toChild.x;
        const childY = evt.offsetY - toChild.y;
        let evtKind;
        // set kind for events we want, bail out for any others
        switch (evt.type) {
            case 'mousedown':
                if (evt.button !== 0)
                    return;
                evtKind = 'press';
                break;
            case 'mouseup':
                if (evt.button !== 0)
                    return;
                evtKind = 'release';
                break;
            case 'mousemove':
                evtKind = 'move';
                break;
            default:
                return;
        }
        toChild.dispatchRawEvent(evtKind, childX, childY);
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Utility method to pull out the canvas with the given id and extract 
    // its drawing context (which has a reference back to that canvas in it)
    _getCanvasContext(canvasID) {
        // type guards to let us deal with HTML objects in a type safe fasion
        function isHTMLCanvasElement(canv) {
            return (canv && (canv instanceof HTMLCanvasElement));
        }
        function isCanvasRenderingContext2D(ctx) {
            return (ctx && (ctx instanceof CanvasRenderingContext2D));
        }
        // look up the canvas using the ID and validate the result
        const canv = document.getElementById(canvasID);
        if (!canv || !isHTMLCanvasElement(canv))
            throw new Error(`Can't find a canvas element with id:"${canvasID}"`);
        // get the drawing context object for the canvas and validate the result
        const ctx = canv.getContext('2d');
        if (!ctx || !isCanvasRenderingContext2D(ctx))
            throw new Error(`Can't get rendering context for canvas element with id:"${canvasID}"`);
        return ctx;
    }
} // end class Root
//===================================================================
//# sourceMappingURL=Root.js.map