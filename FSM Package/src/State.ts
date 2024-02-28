
import { EventSpec, EventType } from "./EventSpec.js";
import { Region } from "./Region.js";
import { Transition, Transition_json } from "./Transition.js";
import { Err } from "./Err.js";
import { Check } from "./Check.js";


//===================================================================
// Class for an object representing an FSM state.  This object consists of a name
// and a list of transition objects.  See the Transition class for more detail on 
// those.  Overall objects of this class primarily just hold the data structure 
// together, but don't do much on their own.  
//
// This class supports construction from (part of) a .json file using the fromJson() 
// static method.  This method expects (but dynamically type checks) a State_json typed 
// object which has been reconstructed from json encoded data.
//===================================================================

export type State_json = {name: string, transitions: Transition_json[]};

//. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

export class State {
    public constructor(name : string, transitions : Transition[]) {
        this._name = name;
        this._transitions = transitions;
    }

    // Construct a State from a State_json object, checking all the parts (since data 
    // coming from json parsing lives in javascript land and may not actually be typed
    // at runtime as we think/hope it is).
    public static fromJson(state : State_json) : State {
        const name = Check.stringVal(state.name, "State.fromJson{name:}");
        let transitions : Transition[] = [];
        if (!Array.isArray(state.transitions)) {
            Err.emit("Transition list is not an array in State.fromJson()");
        } else {
            for (let trans of state.transitions) {
                transitions.push(Transition.fromJson(trans));
            }
        }
        return new State(name, transitions);
    }  
 
    //-------------------------------------------------------------------
    // Properties
    //-------------------------------------------------------------------

    // Name of this state
    protected _name : string;
    public get name() {return this._name;}

    // List of transitions out of this state.
    protected _transitions : Transition[];
    public get transitions() : readonly Transition[] {return this._transitions;}
        
   
    //-------------------------------------------------------------------
    // Debugging Support
    //-------------------------------------------------------------------

    // Create a short human readable string representing this object for debugging
    public debugTag() : string {
        return `State(${this.name})`;
    }

    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    
    // Create a human readable string displaying this object for debugging purposes
    public debugString(indent : number = 0) : string {
        let result = "";
        const indentStr = '  ';  // two spaces per indent level

        // produce the indent
        for (let i = 0; i < indent; i++) result += indentStr;

        result += `State ${this.name}\n`;
        for (let i = 0; i < indent; i++) result += indentStr;
        result += `  Transitions[${this.transitions.length}]:\n`;
        for (let tran of this.transitions) {
            result += tran.debugString(indent+2);
        }
        
        return result;
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    
    // Log a human readable string for this object to the console
    public dump() {
        console.log(this.debugString());
    }
    
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
  
} // end class State

//===================================================================
