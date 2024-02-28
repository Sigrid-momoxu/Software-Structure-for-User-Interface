import { Err } from "./Err.js";
import { Check } from "./Check.js";
const actionTypeStrings = ['set_image', 'clear_image', 'none', 'print', 'print_event'];
//. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
export class Action {
    constructor(actType, regionName, param) {
        this._actType = actType;
        this._onRegionName = regionName !== null && regionName !== void 0 ? regionName : "";
        this._param = param !== null && param !== void 0 ? param : "";
        this._onRegion = undefined; // will be established once we have the whole FSM
    }
    // Construct an Action from an Action_json object.  We type check all the parts here
    // since data coming from json parsing lives in javascript land and may not actually 
    // be typed at runtime as we have declared it here.
    static fromJson(jsonVal) {
        var _a, _b;
        const actType = Check.limitedString(jsonVal.act, actionTypeStrings, "none", "Action.fromJson{act:}");
        const regionname = Check.stringVal((_a = jsonVal.region) !== null && _a !== void 0 ? _a : "", "Action.fromJsonl{region:}");
        const param = Check.stringVal((_b = jsonVal.param) !== null && _b !== void 0 ? _b : "", "Action.fromJson{param:}");
        return new Action(actType, regionname, param);
    }
    get actType() { return this._actType; }
    get onRegionName() { return this._onRegionName; }
    get onRegion() { return this._onRegion; }
    get param() { return this._param; }
    //-------------------------------------------------------------------
    // Methods
    //-------------------------------------------------------------------
    // Carry out the action represented by this object.  evtType and evtReg describe
    // the event which is causing the action (for use by print_event actions).
    execute(evtType, evtReg) {
        if (this._actType === 'none')
            return;
        // **** YOUR CODE HERE ****
        // Use a switch statement to handle different action types based on '_actType'
        switch (this._actType) {
            case 'set_image':
                // If an event region is provided, set its image location to '_param'
                if (evtReg) {
                    evtReg.imageLoc = this._param;
                }
                break;
            case 'clear_image':
                // If an event region is provided, clear its image location
                if (evtReg) {
                    evtReg.imageLoc = "";
                }
                break;
            case 'print':
                // Print the parameter to the console
                console.log(this._param);
                break;
            case 'print_event':
                // Print the parameter and event details to the console
                console.log(`${this._param}, Event Type: ${evtType}, Region: ${evtReg ? evtReg.name : 'None'}`);
                break;
            default:
                // If the action type is unknown, print an error message to the console
                console.error(`Unknown action type: ${this._actType}`);
        }
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Attempt to find the name listed for this region in the given list of regions
    // (from the whole FSM), assiging the Region object to this._onRegion if found.
    bindRegion(regionList) {
        // **** YOUR CODE HERE ****
        // Search for a region in the list that has the same name as the '_onRegionName' property of this instance
        const matchingRegion = regionList.find(region => region.name === this._onRegionName);
        // If a matching region is found, set that region to the '_onRegion' property
        if (matchingRegion) {
            this._onRegion = matchingRegion;
            return; // Exit the function after setting the matching region
        }
        // If no region matches and the action type is 'none', 'print', or 'print_event',
        // set the '_onRegion' property to undefined (no specific region is assigned)
        if (this.actType === 'none' || this.actType === 'print' ||
            this.actType === 'print_event') {
            this._onRegion = undefined;
            return; // Exit the function after setting the '_onRegion' to undefined
        }
        // If no matching region is found and the action type is not 'none', 'print', or 'print_event',
        // emit an error stating that the specified region name does not match any in the region set
        Err.emit(`Region '${this._onRegionName}' in action does not match any region set.`);
    }
    //-------------------------------------------------------------------
    // Debugging Support
    //-------------------------------------------------------------------
    // Create a short human readable string representing this object for debugging
    debugTag() {
        return `Action(${this.actType} ${this.onRegionName} "${this.param}")`;
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Create a human readable string displaying this object for debugging purposes
    debugString(indent = 0) {
        let result = "";
        const indentStr = '  '; // two spaces per indent level
        // produce the indent
        for (let i = 0; i < indent; i++)
            result += indentStr;
        // main display
        result += `${this.actType} ${this.onRegionName} "${this.param}"`;
        // possible warning about an unbound region
        if (!this.onRegion && this.actType !== 'none' &&
            this.actType !== 'print' && this.actType !== 'print_event') {
            result += " unbound";
        }
        return result;
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Log a human readable string for this object to the console
    dump() {
        console.log(this.debugString());
    }
} // end class Action
//===================================================================
//# sourceMappingURL=Action.js.map