import { Root } from "./Root.js";
import { FSMInteractor } from "./FSMInteractor.js";
import { Region } from "./Region.js";
import { State } from "./State.js";
import { EventSpec } from "./EventSpec.js";
import { Action } from "./Action.js";
import { FSM } from "./FSM.js";
import { Transition } from "./Transition.js";
//. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// The root object which will be linked to our canvas (which must have 
// an ID of "FSM-main-canvae"), and which we will build our test objects under.
let root;
//-------------------------------------------------------------------
// Main testing routine -- invoked from index.html 
//-------------------------------------------------------------------
export function runTests() {
    console.log("Running...");
    root = new Root("FSM-main-canvas");
    root.doDebugOutput = true;
    test1();
    // test2();
    // test3();
    // testCheckbox();
    // testRadioButton();
    // testButton();
    // testToggleSwitch();
    console.log("Test is set up...");
}
//-------------------------------------------------------------------
// Test of building an FSM interactor by initialization in code.  The FSM here
// has one state with one transition that loops all event back to itself with 
// a print_event action to display what events are delivered.  Images in this 
// test do not change.
function test1() {
    let r1 = new Region("r1", "./images/one.png", 0, 0, 50, 77);
    let r2 = new Region("r2", "./images/two.png", 20, 50, -1, 50);
    let r3 = new Region("r3", "./images/three.png", 40, 100, 77, 30);
    let r4 = new Region("r4", "./images/four.png", 60, 150);
    let r5 = new Region("r5", "", 80, 200, 77, 77);
    let ev1 = new EventSpec('any', '*');
    let acts = [];
    acts[0] = new Action('print_event', "", "evt--->");
    let tr1 = new Transition('only_state', ev1, acts);
    let st1 = new State('only_state', [tr1]);
    const fsm = new FSM([r1, r2, r3, r4, r5], [st1]);
    let fsmInt = new FSMInteractor(fsm);
    root.addChild(fsmInt);
}
//. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// Test of an object loaded from a .json file.  This test produces an FSM similar
// to test1() (e.g., with fixed images and one "loopback/debug" state)
function test2() {
    let fsmInt = new FSMInteractor(undefined, 170, 0);
    root.addChild(fsmInt);
    fsmInt.startLoadFromJson("./fsm_json/test2.json");
}
//. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .
// Create a more comprehensive and functional object from a .json file.
function test3() {
    let fsmInt = new FSMInteractor(undefined, 400, 0);
    root.addChild(fsmInt);
    fsmInt.startLoadFromJson("./fsm_json/stick.json");
}
//-------------------------------------------------------------------
function testCheckbox() {
    // Actions when transitioning to the checked state
    const actsToChecked = [
        new Action('print_event', "", "Checkbox checked."),
        new Action('set_image', "checkbox", "./images/checkbox.png") // Set image to 'checked'
    ];
    // Actions when transitioning to the unchecked state
    const actsToUnchecked = [
        new Action('print_event', "", "Checkbox unchecked."),
        new Action('set_image', "checkbox", "./images/uncheckbox.png") // Set image to 'unchecked'
    ];
    // Define event specifications
    const pressEvent = new EventSpec('press', '*');
    // Define transitions to toggle the checkbox state
    const toCheckedTransition = new Transition('checked_state', pressEvent, actsToChecked);
    const toUncheckedTransition = new Transition('unchecked_state', pressEvent, actsToUnchecked);
    // Define states with appropriate transitions
    const uncheckedState = new State('unchecked_state', [toCheckedTransition]); // State when unchecked
    const checkedState = new State('checked_state', [toUncheckedTransition]); // State when checked
    // Create a region for the checkbox, initial image is the unchecked image
    const checkboxRegion = new Region("checkbox", "./images/uncheckbox.png", 0, 0, 100, 100);
    // Create the FSM with regions and states
    const checkboxFSM = new FSM([checkboxRegion], [uncheckedState, checkedState]);
    // Bind the FSM to an interactor and add it to the root container
    let checkboxInteractor = new FSMInteractor(checkboxFSM);
    root.addChild(checkboxInteractor); // Assuming 'root' is a predefined container for your interactors
}
//-------------------------------------------------------------------
function deselectOthers(radioButtons, selectedIndex) {
    radioButtons.forEach((otherRadioButton, index) => {
        if (index !== selectedIndex) {
            const fsm = otherRadioButton.fsm;
            if (fsm) {
                // Assuming 'deselected' is an action to deselect, not an event
                fsm.actOnEvent('press'); // We need to define this actOnAction method
            }
        }
    });
}
function testRadioButton() {
    const radioButtonCount = 4;
    const radioButtons = [];
    for (let i = 0; i < radioButtonCount; i++) {
        // Define actions, event specs, transitions, and states
        const selectActions = [
            new Action('set_image', "option" + (i + 1), "./images/checkbox.png"),
            new Action('print_event', "", `Option ${i + 1} selected.`),
        ];
        const deselectActions = [
            new Action('set_image', "option" + (i + 1), "./images/uncheckbox.png"),
            new Action('print_event', "", `Option ${i + 1} deselected.`)
        ];
        const pressEvent = new EventSpec('press', '*');
        const deselectEvent = new EventSpec('press', 'selected'); // Assuming 'deselect' is the correct event
        // Transition for selecting this radio button
        const toSelectedTransition = new Transition('selected', pressEvent, selectActions);
        const toDeselectedTransition = new Transition('deselected', deselectEvent, deselectActions); // Assuming there is a transition for deselecting
        const deselectedState = new State('deselected', [toSelectedTransition]);
        const selectedState = new State('selected', [toDeselectedTransition]); // Assuming a selected state
        const region = new Region("option" + (i + 1), "./images/uncheckbox.png", 0, i * 120, 100, 100);
        const fsm = new FSM([region], [deselectedState, selectedState]); // Including both states
        // Create FSMInteractor and add to the array
        const fsmInteractor = new FSMInteractor(fsm);
        radioButtons.push(fsmInteractor);
        // Assuming there's a root container that can have children added
        root.addChild(fsmInteractor);
    }
    // Returning the radioButtons array for further use if needed
    return radioButtons;
}
//-------------------------------------------------------------------
function testRotaryDial() {
}
//-------------------------------------------------------------------
function testButton() {
    // Action that prints event details to the console
    const printAction = new Action('print_event', "", "Event occurred: ");
    // Define actions for changing the button images
    const highlightAction = new Action('set_image', "button", "./images/highlight.png");
    const normalAction = new Action('set_image', "button", "./images/normal.png");
    const pressedAction = new Action('set_image', "button", "./images/pressed.png");
    // Define event specifications
    const enterEvent = new EventSpec('enter', '*');
    const exitEvent = new EventSpec('exit', '*');
    const pressEvent = new EventSpec('press', 'button');
    const clickEvent = new EventSpec('press', '*'); // Assuming 'click' is a valid event type
    // Define transitions for button interactions
    const onEnterTransition = new Transition('highlighted', enterEvent, [printAction, highlightAction]);
    const onExitTransition = new Transition('normal', exitEvent, [printAction, normalAction]);
    const onPressTransition = new Transition('pressed', pressEvent, [printAction, pressedAction]);
    const onClickTransitionFromPressed = new Transition('normal', clickEvent, [printAction, normalAction]);
    // No transition for click in 'normal' state to stay in 'normal'
    // Define states with appropriate transitions
    const normalState = new State('normal', [onEnterTransition, onPressTransition]);
    const highlightedState = new State('highlighted', [onExitTransition, onPressTransition]);
    const pressedState = new State('pressed', [onEnterTransition, onClickTransitionFromPressed]);
    // Create a region for the button, initial image is the normal button image
    const buttonRegion = new Region("button", "./images/normal.png", 0, 0, 200, 200);
    // Create the FSM with the region and states
    const buttonFSM = new FSM([buttonRegion], [normalState, highlightedState, pressedState]);
    // Bind the FSM to an interactor and add it to the root container
    let buttonInteractor = new FSMInteractor(buttonFSM);
    root.addChild(buttonInteractor);
}
//-------------------------------------------------------------------
function testToggleSwitch() {
    // Actions when transitioning to the 'on' state
    const actionsToOn = [
        new Action('print_event', "", "Toggle switch turned on."),
        new Action('set_image', "toggleSwitch", "./images/switch_on.png") // Set image to 'on'
    ];
    // Actions when transitioning to the 'off' state
    const actionsToOff = [
        new Action('print_event', "", "Toggle switch turned off."),
        new Action('set_image', "toggleSwitch", "./images/switch_off.png") // Set image to 'off'
    ];
    const pressEvent = new EventSpec('press', '*');
    // Define transitions to change the toggle switch state
    const toOnTransition = new Transition('on_state', pressEvent, actionsToOn);
    const toOffTransition = new Transition('off_state', pressEvent, actionsToOff);
    // Define states with appropriate transitions
    const offState = new State('off_state', [toOnTransition]); // State when the switch is off
    const onState = new State('on_state', [toOffTransition]); // State when the switch is on
    // Create a region for the toggle switch, initial image is the 'off' image
    const toggleSwitchRegion = new Region("toggleSwitch", "./images/switch_off.png", 0, 0, 300, 120);
    // Create the FSM with regions and states
    const toggleSwitchFSM = new FSM([toggleSwitchRegion], [offState, onState]);
    // Bind the FSM to an interactor and add it to the root container
    let toggleSwitchInteractor = new FSMInteractor(toggleSwitchFSM);
    root.addChild(toggleSwitchInteractor); // Assuming 'root' is a predefined container for your interactors
}
//# sourceMappingURL=test_cases.js.map