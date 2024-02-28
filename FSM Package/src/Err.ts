//===================================================================
// (Static) class for configurable error handling.  
// This class provides static methods for configurable handling of an exception.
// In particular the static method Err.handle() accepts an object that was thrown
// as an exception and handles it in a way controlled by the Err.handleMethod
// property as follows:
//   * 'silent'        silently swallow the error and press ahead (probably a bad idea)
//   * 'message'       print  a one line message extracted from the exception to 
//                     console.log() and press ahead (i.e., return to the caller)
//   * 'full_message'  print message and stack trace to console.log(), then press ahead 
//   * 'throw';        re-throw the exception
// where the messages and stack trace are taken from the exception object (if it 
// implements the Error interface).  The Err.handleMethod property defaults to 'message'.
//=================================================================== 

// Setting values for configuring error handling by the Err class
export type ErrHandlingSetting = 
    'silent'       | // silently swallow the error and press ahead (probably a bad idea)
    'message'      | // print message from the exception to console.log() and press ahead
    'full_message' | // print message and stack trace to console.log(), then press ahead 
    'throw';         // re-throw the exception
    
//. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

// (Static) class to encapsulate configurable error handling
export class Err {

    // This is a purely static class, so no constructor
    
    //------------------------------------------------------------------- 
    // Properties
    //-------------------------------------------------------------------

    // Property controlling how we handle exceptions in Err.handle(), defaults to 'message'.
    protected static _handleMethod : ErrHandlingSetting = 'message';
    public static get handleMethod() {return this._handleMethod;}
    public static set handleMethod(v : ErrHandlingSetting) {this._handleMethod = v;}

    //-------------------------------------------------------------------
    // Methods
    //-------------------------------------------------------------------

    // Handle the given exception based one a selected exception handling method.
    // The second (optional) parameter determines how many calls to go back in the 
    // stack trace to find what is likely the location of the error (in order to assist
    // in producing better messages, for the 'message' setting, but not used for 
    // 'full_message').The third (optional) parameter may provide extra message text to 
    // be included with any message produced. If a specific exception handling method is 
    // passed in the optional final parameter, that forces a particular type of response 
    // (for this call only).  Otherwise (and more typically) we default to the global 
    // setting in Err.handleMethod.
    public static handle(
        except        : any, 
        stackRollback : number = 0,
        extraMessage  : string = '',
        handleMeth    : ErrHandlingSetting = Err.handleMethod) : void 
    {
        // start with a minimal message
        let exLine = 'Exception: ' + extraMessage + ' ';

        // if except implements the Error interface we can add a message from that 
        if ('message' in except) exLine += except.message;

        // now handle the error based on the selected setting
        switch (handleMeth) {
            case 'silent': 
            return;

            case 'message': 
                // if the exception implements Error, extract more from the stack trace
                if ('stack' in except) {
                    // split the lines of the stack trace out into an array of strings
                    let trace : string[] = except.stack.split("\n");

                    // roll the stack trace back by stackDiscard+1 lines to 
                    // get back in the call chain to the actual point that the error 
                    // was initiated.  (+1 is because the first line just has a copy of 
                    // the message we extracted and reformmated above, which we don't 
                    // want to repeat here).
                    for (let i = 0; i < stackRollback+1; i++) trace.shift();

                    // cut down to a single line which should have the location of where
                    // the error was originated, and put that on the message
                    const traceLine = trace.shift()?.trim();
                    exLine += " " + traceLine;
                }
                console.log(exLine);
            return;

            case 'full_message':
                // just put out the whole stack trace (if available) as is
                const trace: string = ('stack' in except) ? except.stack : '';
                console.log("Exception: " + extraMessage + trace);
            return;

            case 'throw':
                throw except;
        }
    } 

    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

    // Uitllity method to emit a particular error message. This throws an Error
    // with that message internally to gather a stack trace and then immediately 
    // catches that and handles it with Err.handle().
    public static emit(msg : string = "") : void {
        try {
            throw new Error(msg);
        } catch (err) {Err.handle(err, 1);}
    }

    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

    // Utllity metod to force an exception (with a particular error message) to be 
    // thrown by Err.handle().  This throws an Error with the message internally to 
    // gather a stack trace and then immediately catches that and handles it with 
    // Err.handle() configured to re-throw that error.
    public static crash(msg : string = "") : void {
        // process, but force a throw
        try {
            throw new Error(msg);
        } catch (err) {Err.handle(err, 1, "", 'throw');}
    }

    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .

    // Utility method to emit a warning message with a given message.  This throws an
    // Error with that message internally to gather a stack trace and then immediately 
    // catches that and handles it with Err.handle temporarily reconfigured by using
    // 'message' instead of 'throw' (if that was the global setting; if we were set up 
    // with 'full_message' that is used instead)
    public static warning(msg : string = "") : void {
        // for a warning, we downgrade 'throw' to just a message 
        // if that would have been in effect
        let handl : ErrHandlingSetting = Err.handleMethod;
        if (handl === 'throw') handl = 'message';
        try {
            throw new Error(msg);
        } catch (err) {Err.handle(err, 1, "", handl);}
    }

    //. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
} // end Err class

//===================================================================
