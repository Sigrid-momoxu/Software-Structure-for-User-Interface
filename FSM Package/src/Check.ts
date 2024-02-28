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
    public static typeName(value : any) : string {
        let name : string = typeof value;
      
        // for anything that's not an object, return the typeof string as-is
        if (name !== 'object') return name;
      
        // null is one possible object
        if (value === null) return "null";
      
        // for arrays, if it's empty we just call it an Array, otherwise we assume 
        // it's uniform and name it as an array of whatever typename we get for the first 
        // element.  Note that this may not be a correct, since it might only be 
        // capturing one type from a union type.  But this is for debugging/message 
        // purposes so this is going to be considered close enough.
        if (Array.isArray(value))  {
            if (value.length === 0) return "Array";
            return Check.typeName(value[0]) + [];
        }
      
        // for all other objects try to get the name of the constructor or fall back to just 'object'
       return (value.constructor?.name) ?? 'object';
    }

    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

    // Construct an error message string for type mismatch errors
    protected static _typeErrMesg(
        expTypeName : string, 
        foundVal    : any, 
        errLoc      : string = "") : string 
    {
        let mesg : string = "Type error";
        if (errLoc) mesg += `in ${errLoc}`;
        return mesg + ` expected: ${expTypeName}, found: ${Check.typeName(foundVal)}`;
    }
    
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

    // Do a type check on a value expected to be a simple type. The type name is given
    // as a string (as returned by typeof), and a default value must be provided which
    // will replace any erroneous values.  An indication of a location to be 
    // provided in an error message can also optionally be provided.
    public static simpleType<ExpType>(
        val : any, 
        expTypeName  : 'undefined' | 'boolean' | 'number' | 'bigint' | 'string' | 'symbol',
        defaultValue : ExpType,
        errLoc       : string = "") : ExpType 
    {
        let foundType : string = typeof val;
        if (foundType === 'object' || foundType === 'function') { 
            Err.emit(Check._typeErrMesg(expTypeName, val, errLoc));
            return defaultValue;
        }

        if (expTypeName !== foundType) {
                Err.emit(Check._typeErrMesg(expTypeName, val, errLoc));
                return defaultValue;
            } else {
                return val;
            }
    } 

    // Do a check for a string value
    public static stringVal(val : any, errLoc : string = "") : string {
        return Check.simpleType<string>(val, 'string', "", errLoc);
    }

    // Do a check for a number value
    public static numberVal(val : any, errLoc : string = "") : number {
        return Check.simpleType<number>(val, 'number', 0, errLoc);
    }

    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . 

    // Determine if the given value is an instance of the given simple type (espressed as
    // a string as returned by typeof).
    public static isSimpleType(
        val          : any, 
        expTypeName  : 'undefined' | 'boolean' | 'number' | 'bigint' | 'string' | 'symbol'
    ) : boolean {
        let foundType : string = typeof val;
        return expTypeName === foundType;
    }
 
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

    // Check a value we are expecting to be a string taking on one of a limited 
    // set of values (AKA a uniion type across some specific strings).
    public static limitedString<LimitedStringType>(
        val          : any,
        validStrings : string[],
        defaultValue : LimitedStringType,
        errLoc       : string = "") : LimitedStringType 
    {
        // if it's one of our values, we just return it
        if (typeof val === 'string') {
            if (validStrings.indexOf(val) >= 0) { 
                return val as LimitedStringType;
            }
        } 
        
        // otherwise we construct a message, emit an error, and return the default
        let mesg : string = "Unexpected string value";
        if (errLoc) mesg += ` in ${errLoc}`;
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
    public static arrayofSimpleType<ExpElmType>(
        val : any, 
        expElmTypeName  : 'undefined' | 'boolean' | 'number' | 'bigint' | 'string' | 'symbol',
        defaultValue : ExpElmType[] = [],
        errLoc       : string = "") : ExpElmType[] 
    {
        // is it an array at all?
        let foundType : string = typeof val;
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
        } else {  // not an array so this fails
            Err.emit(Check._typeErrMesg(expElmTypeName + "[]", val, errLoc));
            return defaultValue;
        }
    }
    
    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

    // Check a value we are expecting to be an object of a specific class.  The class
    // is represented by a string which should match the constructor for the class.
    // A default value is provided which will be returned when errors are found, and 
    // an optional string indicating a location to report with the error can be provided.
    public static objectClass<ObjType extends Object | undefined>(
      val : Object, 
      expClassName : string,
      defaultValue? : ObjType,
      errLoc        : string = "") : ObjType | undefined
    {
        let foundType : string = typeof val;
        if (typeof val !== 'object' || val.constructor?.name !== expClassName) {
            Err.emit(Check._typeErrMesg(expClassName, val, errLoc));
            return defaultValue;
        }
        return val as ObjType;
    }

} // end class Check

//===================================================================