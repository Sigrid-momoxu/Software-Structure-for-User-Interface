import { Transition } from "./Transition.js";
import { Err } from "./Err.js";
import { Check } from "./Check.js";
//. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
export class State {
    constructor(name, transitions) {
        this._name = name;
        this._transitions = transitions;
    }
    // Construct a State from a State_json object, checking all the parts (since data 
    // coming from json parsing lives in javascript land and may not actually be typed
    // at runtime as we think/hope it is).
    static fromJson(state) {
        const name = Check.stringVal(state.name, "State.fromJson{name:}");
        let transitions = [];
        if (!Array.isArray(state.transitions)) {
            Err.emit("Transition list is not an array in State.fromJson()");
        }
        else {
            for (let trans of state.transitions) {
                transitions.push(Transition.fromJson(trans));
            }
        }
        return new State(name, transitions);
    }
    get name() { return this._name; }
    get transitions() { return this._transitions; }
    //-------------------------------------------------------------------
    // Debugging Support
    //-------------------------------------------------------------------
    // Create a short human readable string representing this object for debugging
    debugTag() {
        return `State(${this.name})`;
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Create a human readable string displaying this object for debugging purposes
    debugString(indent = 0) {
        let result = "";
        const indentStr = '  '; // two spaces per indent level
        // produce the indent
        for (let i = 0; i < indent; i++)
            result += indentStr;
        result += `State ${this.name}\n`;
        for (let i = 0; i < indent; i++)
            result += indentStr;
        result += `  Transitions[${this.transitions.length}]:\n`;
        for (let tran of this.transitions) {
            result += tran.debugString(indent + 2);
        }
        return result;
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Log a human readable string for this object to the console
    dump() {
        console.log(this.debugString());
    }
} // end class State
//===================================================================
//# sourceMappingURL=State.js.map