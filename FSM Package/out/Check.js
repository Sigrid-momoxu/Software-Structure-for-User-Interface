import { Err } from "./Err.js";
//===================================================================
// A (static) utility class for doing a variety of run-time type checks.  These 
// are needed primarily to deal with objects reconstructed from a .json file since 
// those live in javascript land and don't necessarily conform to any particular type
// (declared or otherwise).  Each checking routine returns a value of the type it
// is supposed to be looking for.  If all is well with the check that will just be
// the value passed in.  However, if an error is detected, some type of patch-up will
// be attempted, either by mutating the given value, or substituting something else.
// Errors will also be reported by calling Err.emit() with as meaningful a message as
// can be provided.
//===================================================================
export class Check {
    // This is a class with all static methods, so no constructor
    //-------------------------------------------------------------------
    // Static Methods
    //-------------------------------------------------------------------
    // Construct a string with the name of the type of the given object.  Note: the 
    // name provided for array objects is constructed from the type of the first 
    // object in the array (or just given as "Array" if it is empty).  This may be 
    // a subset of the actual base type for the array.  For objects, we use the name
    // of the constructor (or "Object" if that's missing).
    static typeName(value) {
        var _a, _b;
        let name = typeof value;
        // for anything that's not an object, return the typeof string as-is
        if (name !== 'object')
            return name;
        // null is one possible object
        if (value === null)
            return "null";
        // for arrays, if it's empty we just call it an Array, otherwise we assume 
        // it's uniform and name it as an array of whatever typename we get for the first 
        // element.  Note that this may not be a correct, since it might only be 
        // capturing one type from a union type.  But this is for debugging/message 
        // purposes so this is going to be considered close enough.
        if (Array.isArray(value)) {
            if (value.length === 0)
                return "Array";
            return Check.typeName(value[0]) + [];
        }
        // for all other objects try to get the name of the constructor or fall back to just 'object'
        return (_b = ((_a = value.constructor) === null || _a === void 0 ? void 0 : _a.name)) !== null && _b !== void 0 ? _b : 'object';
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Construct an error message string for type mismatch errors
    static _typeErrMesg(expTypeName, foundVal, errLoc = "") {
        let mesg = "Type error";
        if (errLoc)
            mesg += `in ${errLoc}`;
        return mesg + ` expected: ${expTypeName}, found: ${Check.typeName(foundVal)}`;
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Do a type check on a value expected to be a simple type. The type name is given
    // as a string (as returned by typeof), and a default value must be provided which
    // will replace any erroneous values.  An indication of a location to be 
    // provided in an error message can also optionally be provided.
    static simpleType(val, expTypeName, defaultValue, errLoc = "") {
        let foundType = typeof val;
        if (foundType === 'object' || foundType === 'function') {
            Err.emit(Check._typeErrMesg(expTypeName, val, errLoc));
            return defaultValue;
        }
        if (expTypeName !== foundType) {
            Err.emit(Check._typeErrMesg(expTypeName, val, errLoc));
            return defaultValue;
        }
        else {
            return val;
        }
    }
    // Do a check for a string value
    static stringVal(val, errLoc = "") {
        return Check.simpleType(val, 'string', "", errLoc);
    }
    // Do a check for a number value
    static numberVal(val, errLoc = "") {
        return Check.simpleType(val, 'number', 0, errLoc);
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 
    // Determine if the given value is an instance of the given simple type (espressed as
    // a string as returned by typeof).
    static isSimpleType(val, expTypeName) {
        let foundType = typeof val;
        return expTypeName === foundType;
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Check a value we are expecting to be a string taking on one of a limited 
    // set of values (AKA a uniion type across some specific strings).
    static limitedString(val, validStrings, defaultValue, errLoc = "") {
        // if it's one of our values, we just return it
        if (typeof val === 'string') {
            if (validStrings.indexOf(val) >= 0) {
                return val;
            }
        }
        // otherwise we construct a message, emit an error, and return the default
        let mesg = "Unexpected string value";
        if (errLoc)
            mesg += ` in ${errLoc}`;
        mesg += `: found: "${val}" expected one of: `;
        let sep = '';
        for (let str of validStrings) {
            mesg += `${sep}"${str}"`;
            sep = ', ';
        }
        Err.emit(mesg);
        return defaultValue;
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Check a value we are expecting to be an array of some simple type
    static arrayofSimpleType(val, expElmTypeName, defaultValue = [], errLoc = "") {
        // is it an array at all?
        let foundType = typeof val;
        if (foundType === 'object' && Array.isArray(val)) {
            // check each element for the expected type
            for (let i = 0; i < val.length; i++) {
                if (!Check.isSimpleType(val[i], expElmTypeName)) {
                    errLoc += ` @[${i}]`;
                    Err.emit(Check._typeErrMesg(expElmTypeName + '[]', val, errLoc));
                }
            }
            // if we make it here, everything was ok
            return val;
        }
        else { // not an array so this fails
            Err.emit(Check._typeErrMesg(expElmTypeName + "[]", val, errLoc));
            return defaultValue;
        }
    }
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
    // Check a value we are expecting to be an object of a specific class.  The class
    // is represented by a string which should match the constructor for the class.
    // A default value is provided which will be returned when errors are found, and 
    // an optional string indicating a location to report with the error can be provided.
    static objectClass(val, expClassName, defaultValue, errLoc = "") {
        var _a;
        let foundType = typeof val;
        if (typeof val !== 'object' || ((_a = val.constructor) === null || _a === void 0 ? void 0 : _a.name) !== expClassName) {
            Err.emit(Check._typeErrMesg(expClassName, val, errLoc));
            return defaultValue;
        }
        return val;
    }
} // end class Check
//===================================================================
//# sourceMappingURL=Check.js.map