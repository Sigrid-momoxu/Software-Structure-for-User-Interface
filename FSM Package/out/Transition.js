import { EventSpec } from "./EventSpec.js";
import { Action } from "./Action.js";
import { Err } from "./Err.js";
import { Check } from "./Check.js";
//. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
export class Transition {
    constructor(targetName, onEvt, actions) {
        // handle variant parameters
        this._targetName = targetName;
        this._onEvent = onEvt;
        this._actions = actions;
        this._target = undefined; // gets bound later with bindTarget()
    }
    // Construct a Transition from a Transition_json object, checking all the parts 
    // (since data coming from json parsing lives in javascript land and may not actually 
    // be typed at runtime as we think/hope it is).
    static fromJson(trans) {
        const targName = Check.stringVal(trans.target, "Transition.fromJson{target:}");
        const onevt = EventSpec.fromJson(trans.onEvent);
        // missing actions are treated as an empty array of actions
        if (trans.actions === undefined)
            trans.actions = [];
        let actions = [];
        if (!Array.isArray(trans.actions)) {
            Err.emit("Action list not an array in Transition.fromJson()");
        }
        else {
            for (let act of trans.actions) {
                actions.push(Action.fromJson(act));
            }
        }
        return new Transition(targName, onevt, actions);
    }
    get targetName() { return this._targetName; }
    get target() { return this._target; }
    get onEvent() { return this._onEvent; }
    get actions() { return this._actions; }
    //-------------------------------------------------------------------
    // Methods 
    //-------------------------------------------------------------------
    // Determine if this transition should be matched by the given event (represented
    // by an event type and optional region; see EventSpec for details on available
    // event types and their meaning).
    match(evtType, regn) {
        // **** YOUR CODE HERE ****
        return this._onEvent.match(evtType, regn);
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
    // Attempt to look up the name of the target state for this transition and 
    // return the actual State object, then assign that to this._target.  _target
    // will remain undefined if the target name does not match any actual states in 
    // the FSM (in which case an error message will also be generted using Err.emit()).
    bindTarget(stateList) {
        // **** YOUR CODE HERE ****
        // find the state matching the name
        const matchedState = stateList.find(state => state.name === this._targetName);
        if (matchedState) {
            this._target = matchedState;
            return;
        }
        // If we have no match state, set _target to undefined
        Err.emit(`State '${this._targetName}' in transition does not match any state.`);
    }
    //-------------------------------------------------------------------
    // Debugging Support
    //-------------------------------------------------------------------
    // Create a short human readable string representing this object for debugging
    debugTag() {
        return "Transition";
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Create a human readable string displaying this object for debugging purposes 
    debugString(indent = 0) {
        var _a;
        let result = "";
        const indentStr = '  '; // two spaces per indent level
        // produce the indent
        for (let i = 0; i < indent; i++)
            result += indentStr;
        result += `onEvt:${this.onEvent.debugString()} -> ${(_a = this.target) === null || _a === void 0 ? void 0 : _a.name}\n`;
        for (let i = 0; i < indent; i++)
            result += indentStr;
        result += `  Actions[${this.actions.length}]:\n`;
        for (let act of this.actions) {
            result += act.debugString(indent + 2) + '\n';
        }
        return result;
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Log a human readable string for this object to the console
    dump() {
        console.log(this.debugString());
    }
} // end class Transition
//===================================================================
//# sourceMappingURL=Transition.js.map