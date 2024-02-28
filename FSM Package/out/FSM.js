import { Region } from "./Region.js";
import { State } from "./State.js";
import { Err } from "./Err.js";
//. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
export class FSM {
    constructor(regions, states, parent) {
        this._regions = regions;
        this._states = states;
        this._startState = states[0];
        this._currentState = this._startState;
        this._parent = parent;
        // do various bits of work such as binding region and state names to actual
        // Region and State objects.
        this._finalize();
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Construct an FSM from an FSM_json object, checking all the parts (since data 
    // coming from json parsing lives in javascript land and may not actually be typed
    // at runtime as we think/hope it is).
    static fromJson(fsm, parent) {
        // start collecting region declarations
        let allNames = new Set();
        let regions = [];
        // must be an array
        if (!Array.isArray(fsm.regions)) {
            Err.emit("Region list is not an array in FSM.fromJson()");
        }
        else {
            // add all the regions 
            for (let reg of fsm.regions) {
                // is this a duplicate name?
                if (allNames.has(reg.name)) {
                    Err.emit(`Duplicate region '${reg.name}' declaration in FSM`);
                }
                else { // no -- add it
                    regions.push(Region.fromJson(reg));
                    allNames.add(reg.name);
                }
            }
        }
        // start collecting states
        allNames.clear();
        let states = [];
        // must be an array
        if (!Array.isArray(fsm.states)) {
            Err.emit("State list is not an array in FSM.fromJson()");
        }
        else {
            // must not be an empty array
            if (fsm.states.length === 0) {
                Err.emit("No states provide for FSM in FSM.fromJson()");
            }
            // add all the states
            for (let st of fsm.states) {
                // is this a duplicate?
                if (allNames.has(st.name)) {
                    Err.emit(`Duplicate state '${st.name}' declaration in FSM`);
                }
                else { // no -- add it
                    states.push(State.fromJson(st));
                    allNames.add(st.name);
                }
            }
        }
        // construct the result object based on the parts we've collected and checked
        return new FSM(regions, states, parent);
    }
    get regions() { return this._regions; }
    get states() { return this._states; }
    get startState() { return this._startState; }
    get currentState() { return this._currentState; }
    get parent() { return this._parent; }
    set parent(v) {
        var _a, _b;
        if (v !== this._parent) {
            (_a = this._parent) === null || _a === void 0 ? void 0 : _a.damage();
            this._parent = v;
            (_b = this._parent) === null || _b === void 0 ? void 0 : _b.damage();
        }
    }
    //-------------------------------------------------------------------
    // Methods 
    //-------------------------------------------------------------------
    // Declare that something managed by this object (most typically a region image, 
    // position, or size) has changed in a way that may make the current display 
    // incorrect and in need of update.  This is called from "child" regions, etc.
    // that this object is composed out of, and is passed "up the tree" to our parent 
    // object, eventually causing a redraw to be performed.  
    // 
    damage() {
        // **** YOUR CODE HERE ****
        var _a;
        (_a = this._parent) === null || _a === void 0 ? void 0 : _a.damage();
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
    // Do connecting and other bookkeeping to initially set up and connect the 
    // various parts making up this FSM.  This includes for example, looking up 
    // region and state names and linking in (binding) the corresponding actual objects.  
    _finalize() {
        // establish actual objects corresponding to textual names:
        // names we need to look up / bind are found in transitions: in named target 
        // state, region names in event specs, and region names in actions.
        // walk over all the transitions in all the states to get those bound
        // **** YOUR CODE HERE ****
        // For each state in the FSM
        for (const state of this.states) {
            for (const transition of state.transitions) {
                // Link transition's target state name to actual state object.
                transition.bindTarget(this.states);
                // Link event spec's region name to actual region object.
                transition.onEvent.bindRegion(this.regions);
            }
        }
        // start state is the first one
        // **** YOUR CODE HERE ****
        this._currentState = this.states[0];
        // need to link all regions back to this object as their parent
        // **** YOUR CODE HERE ****
        for (const region of this._regions) {
            region.parent = this;
        }
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Reset the FSM to be in its start state.  Note: this does not reset
    // region images to their original states.
    reset() {
        // **** YOUR CODE HERE ****
        // Set the current state to the start state
        this._currentState = this.startState;
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
    // Cause the FSM to act on the given event: represented by an event type (see 
    // EventType declared with the EventSpec class) and a region (when the event type
    // needs one).  This method attempts to make one transition in the FSM.  The first
    // transition matching the given event is found, the transitin is "taken" (it's 
    // actions are executed, and the FSM moves to the indicated state).  At that point
    // the event is considered "consumed", and no additional transitions are considered.
    actOnEvent(evtType, reg) {
        // if we never got the current state bound (maybe a bad json FSM?) bail out
        if (!this.currentState)
            return;
        // **** YOUR CODE HERE ****
        // Find the first transition in the current state that matches the event
        const matchingTransition = this.currentState.transitions.find(transition => transition.match(evtType, reg));
        // If we found a matching transition, execute its actions and move to its target state
        if (matchingTransition) {
            for (const action of matchingTransition.actions) {
                action.execute(evtType, reg);
            }
            this._currentState = matchingTransition.target;
        }
    }
    //-------------------------------------------------------------------
    // Debugging Support
    //-------------------------------------------------------------------
    // Create a short human readable string representing this object for debugging
    debugTag() {
        return `FSM([reg:${this.regions.length}],st:[${this.states.length}])`;
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Create a human readable string displaying this object for debugging purposes
    debugString(indent = 0) {
        let result = "";
        const indentStr = '  '; // two spaces per indent level
        // produce the indent
        for (let i = 0; i < indent; i++)
            result += indentStr;
        result += "FSM: ";
        if (this.currentState) {
            result += `currentState: ${this.currentState.name} `;
        }
        if (!this.parent)
            result += "no parent";
        result += "\n";
        result += ` Regions[${this.regions.length}]:\n`;
        for (let reg of this.regions)
            result += reg.debugString(2) + '\n';
        result += ` States[${this.states.length}]:\n`;
        for (let st of this.states)
            result += st.debugString(2) + '\n';
        return result;
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Log a human readable string for this object to the console
    dump() {
        console.log(this.debugString());
    }
} // end class FSM
//===================================================================
//# sourceMappingURL=FSM.js.map