import { EventSpec_json, EventSpec, EventType } from "./EventSpec.js";
import { ActionType, Action_json, Action } from "./Action.js";
import { Region } from "./Region.js";
import { State } from "./State.js";
import { Err } from "./Err.js";
import { Check } from "./Check.js"; 

//===================================================================
// Class to represent a single transition within a finite state machine (FSM).
// A transition consists of an event specification indicating what events should 
// be considered to match this transition, a list of actions to be performed when 
// the transition is "taken" (or "fired"), and a state to move the FSM to as 
// a result of taking the transition.  See EventSpec for more details on how 
// events are matches, and Action for what actions are available.  
//
// This class supports construction from (part of) a .json file using the fromJson() 
// static method.  This method expects (but dynamically type checks) a Transition_json 
// typed object which has been reconstructed from json encoded data.
//===================================================================

// Simple type we are expecting from a json encoding for an object of this class
export type Transition_json = {target: string, onEvent: EventSpec_json, actions: Action_json[] };

//. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

export class Transition {
    public constructor(targetName : string, onEvt : EventSpec, actions : Action[])
    {
        // handle variant parameters
        
        this._targetName = targetName;   
        this._onEvent    = onEvt;
        this._actions    = actions;
        this._target     = undefined;  // gets bound later with bindTarget()
    }
 
    // Construct a Transition from a Transition_json object, checking all the parts 
    // (since data coming from json parsing lives in javascript land and may not actually 
    // be typed at runtime as we think/hope it is).
    public static fromJson(trans : Transition_json) : Transition {

        const targName = Check.stringVal(trans.target, "Transition.fromJson{target:}");
        const onevt = EventSpec.fromJson(trans.onEvent);

        // missing actions are treated as an empty array of actions
        if (trans.actions === undefined) trans.actions = <Action_json[]>[];

        let actions : Action[] = [];
        if (!Array.isArray(trans.actions)) {
            Err.emit("Action list not an array in Transition.fromJson()");
        } else {
            for (let act of trans.actions) {
                actions.push(Action.fromJson(act));
            }
        }
        return new Transition(targName, onevt, actions);
    }  
    
    //-------------------------------------------------------------------
    // Properties
    //-------------------------------------------------------------------

    // The name of the state we move the FSM to if this transition is taken
    protected _targetName  : string;
    public get targetName() {return this._targetName;}

    // The actual State object for the target.  This gets established by bindTarget(),
    // but can remain undefined if the target name is incorrect and doesn't match any 
    // states in the FSM.
    protected _target : State | undefined;
    public get target() {return this._target;}

    // The specification for what events this transition should be considered to match
    // (i.e., that cause the event to be taken/fired).
    protected _onEvent     : EventSpec;
    public get onEvent() {return this._onEvent;}

    // A list of actions, all of which will be executed whenever this transition is 
    // taken/fired.
    protected _actions     : Action[];
    public get actions() : readonly Action[] {return this._actions;}
    
    //-------------------------------------------------------------------
    // Methods 
    //-------------------------------------------------------------------
  
    // Determine if this transition should be matched by the given event (represented
    // by an event type and optional region; see EventSpec for details on available
    // event types and their meaning).
    public match(evtType : EventType, regn? : Region) : boolean {
           
        // **** YOUR CODE HERE ****
        
        return this._onEvent.match(evtType,regn);
    }
    
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
    
    // Attempt to look up the name of the target state for this transition and 
    // return the actual State object, then assign that to this._target.  _target
    // will remain undefined if the target name does not match any actual states in 
    // the FSM (in which case an error message will also be generted using Err.emit()).
    public bindTarget(stateList : readonly State[]) : void {
            
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
    public debugTag() : string {
        return "Transition"
    }

    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
   
    // Create a human readable string displaying this object for debugging purposes 
    public debugString(indent : number = 0) : string {
        let result = "";
        const indentStr = '  ';  // two spaces per indent level

        // produce the indent
        for (let i = 0; i < indent; i++) result += indentStr;

        result += `onEvt:${this.onEvent.debugString()} -> ${this.target?.name}\n`;
        for (let i = 0; i < indent; i++) result += indentStr;
        result += `  Actions[${this.actions.length}]:\n`;
        for (let act of this.actions) {
            result += act.debugString(indent+2) + '\n';
        }

        return result;
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    
    // Log a human readable string for this object to the console
    public dump() {
        console.log(this.debugString());
    }
    
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
} // end class Transition

//===================================================================