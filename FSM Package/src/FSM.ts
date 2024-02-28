import { Root } from "./Root.js";
import { Region, Region_json } from "./Region.js";
import { State, State_json } from "./State.js";
import { Err } from "./Err.js";
import { FSMInteractor } from "./FSMInteractor.js";
import { Transition } from "./Transition.js";
import { EventSpec, EventType } from "./EventSpec.js";
import { Action } from "./Action.js";


//===================================================================
// Class to represent a complete finite state machine (FSM).  The machine consists
// of two parts: a list of regions, and a list of states.  
// * Regions each have an area (bounding box) within a parent FSMInteractor object, 
//   along with an optional image which may be changed and/or removed to implement 
//   the visual component of any behavior. The area of a region determines what events 
//   are considered "inside" it, and hence what actual events are dispatched based 
//   on raw events from the underlying system.  See the Region class for additional 
//   details.
// * States each have state name and a list of transitions out of the state.  The start
//   state for the FSM will always be the first state given in the state list. See the 
//   State class for additional details.  
//   - Transistions out of a state contaions three components: an EventSpec object which
//     describes what events will cause the event to be "taken" (or "fire"), a target 
//     state that the transition will take the machine to, and a list of actions to be 
//     executed when the transition is taken.  See the Transition class for additional 
//     detials.
//     * Actions describe one of a series of things that the transition can cause to 
//       happen when he transition is taken.  These include the ability to change or 
//       clear the image in a region of the FMS, and an ability to print debugging 
//       messages.  See the Action class for more details
//
// JSON Representations
//   FSM objects can be constructed from initialization in code, but more commonly are 
//   represented by objects encode in .json files that are loaded dynamically.  The 
//   static FSM.fromJson() method manages cheching and destructuring the data structure
//   returned from a json load to create an FSM object.  This data is expected to be an 
//   FSM_json object, which in turn composed from Region_json, State_json, 
//   Transition_json, EventSpec_json, and Action_json objects.  (Each of these types is 
//   declared in the file associated with their respective main clases).  Since data 
//   which has been decoded from a .json file is dynamically typed based on whaterver 
//   was found in the file, FSM.fromJson() (and the fromJson routines for various 
//   components), verify the actual runtime types found in the FSM_json data structure.  
//   If errors are found calls to Err.emit() with an appropriate message are made, and 
//   the erroneous value is replaced with a default value of the right type to patch up 
//   the data structure.  This will leave the data structure correctly types, but likely 
//   not fully functional as an FSM.  
//===================================================================

// Type we are expecting to recieve from decoding an FSM from a .json file
export type FSM_json = {regions: Region_json[], states: State_json[]};

//. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

export class FSM {
    public constructor(regions : Region[], states : State[], parent? : FSMInteractor) {
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
    public static fromJson(fsm : FSM_json, parent? : FSMInteractor) : FSM {
        // start collecting region declarations
        let allNames = new Set<string>();
        let regions : Region[] = [];

        // must be an array
        if (!Array.isArray(fsm.regions)) {
            Err.emit("Region list is not an array in FSM.fromJson()");
        } else {
            // add all the regions 
            for (let reg of fsm.regions) {
                // is this a duplicate name?
                if (allNames.has(reg.name)) {
                    Err.emit(`Duplicate region '${reg.name}' declaration in FSM`);
                } else { // no -- add it
                    regions.push(Region.fromJson(reg));
                    allNames.add(reg.name);
                }
            }
        }

        // start collecting states
        allNames.clear();
        let states : State[] = [];

        // must be an array
        if (!Array.isArray(fsm.states)) {
            Err.emit("State list is not an array in FSM.fromJson()");
        } else {
            // must not be an empty array
            if (fsm.states.length === 0) {
                Err.emit("No states provide for FSM in FSM.fromJson()");
            }

            // add all the states
            for (let st of fsm.states) {
                // is this a duplicate?
                if (allNames.has(st.name)) {
                    Err.emit(`Duplicate state '${st.name}' declaration in FSM`);
                } else { // no -- add it
                    states.push(State.fromJson(st));
                    allNames.add(st.name);
                }
            }
        }

        // construct the result object based on the parts we've collected and checked
        return new FSM(regions, states, parent);
    }
    
    //-------------------------------------------------------------------
    // Properties
    //-------------------------------------------------------------------

    // List of regions for this FSM
    protected _regions : Region[];
    public get regions() : readonly Region[] {return this._regions;}

    // List of states for this FSM
    protected _states : State[];
    public get states() : readonly State[] {return this._states;}

    // Start state from the FSM.  As long as the FSM was correnctly formed (i.e., has
    // states in its state list), this will always be the first state in the state
    // list.
    protected _startState : State | undefined;
    public get startState() {return this._startState;}

    // The current state for the FSM
    protected _currentState : State | undefined;
    public get currentState() {return this._currentState;}

    // The FSMIntractor object which this FSM is associated with.
    protected _parent : FSMInteractor | undefined;
    public get parent() : FSMInteractor | undefined { return this._parent;}

    public set parent(v : FSMInteractor | undefined) {
        if (v !== this._parent) {
            this._parent?.damage();
            this._parent = v;
            this._parent?.damage();
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
    public damage() : void {
            
        // **** YOUR CODE HERE ****

        this._parent?.damage();
        
    }

    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 

    // Do connecting and other bookkeeping to initially set up and connect the 
    // various parts making up this FSM.  This includes for example, looking up 
    // region and state names and linking in (binding) the corresponding actual objects.  
    protected _finalize() : void {
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
    public reset() {
            
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
    public actOnEvent(evtType : EventType, reg? : Region) {
        // if we never got the current state bound (maybe a bad json FSM?) bail out
        if (!this.currentState) return;
           
        // **** YOUR CODE HERE ****

        // Find the first transition in the current state that matches the event
        const matchingTransition = this.currentState.transitions.find(transition => transition.match(evtType
            , reg));

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
    public debugTag() : string {
        return `FSM([reg:${this.regions.length}],st:[${this.states.length}])`;
    }

    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Create a human readable string displaying this object for debugging purposes
    public debugString(indent : number = 0) : string {
        let result = "";
        const indentStr = '  ';  // two spaces per indent level

        // produce the indent
        for (let i = 0; i < indent; i++) result += indentStr;

        result += "FSM: ";
        if (this.currentState) {
            result += `currentState: ${this.currentState.name} `;
        }
        if (!this.parent) result += "no parent";
        result += "\n";
        result += ` Regions[${this.regions.length}]:\n`;
        for (let reg of this.regions) result += reg.debugString(2) + '\n';
        result += ` States[${this.states.length}]:\n`;
        for (let st of this.states) result += st.debugString(2) + '\n';
        
        return result;
    }

    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    
    // Log a human readable string for this object to the console
    public dump() {
        console.log(this.debugString());
    }
    
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
} // end class FSM

//===================================================================