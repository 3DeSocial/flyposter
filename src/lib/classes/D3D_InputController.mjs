class InputController {
  constructor(config) {

      this.inputHandler = config.inputHandler;
      this.keyboardState = new Map(); // Tracks the state of the keyboard keys
      this.mouseState = { x: 0, y: 0, button: null }; // Tracks the state of the mouse
      this.touchState = new Map(); // Tracks the state of touch inputs
  
      // Bind event handlers
      window.addEventListener('keydown', e => this.handleKeyDown(e));
      window.addEventListener('keyup', e => this.handleKeyUp(e));
      window.addEventListener('mousemove', e => this.handleMouseMove(e));
      window.addEventListener('mousedown', e => this.handleMouseDown(e));
      window.addEventListener('mouseup', e => this.handleMouseUp(e));
      window.addEventListener('touchstart', e => this.handleTouchStart(e));
      window.addEventListener('touchend', e => this.handleTouchEnd(e));
      //window.addEventListener('touchmove', e => this.handleTouchMove(e));
    }
  
    handleKeyDown(event) {
      this.setKeyState(event, true);
    }

    setKeyState(event, isPressed) {
      
      this.keyboardState.set(event.key, isPressed);
      this.inputHandler.handleInput(event);

    }    
  
    handleKeyUp(event) {
      this.keyboardState.set(event.key, false);
    }
  
    handleMouseMove(event) {
      this.mouseState.x = event.clientX;
      this.mouseState.y = event.clientY;
      this.inputHandler.handleInput(event);      
    }
  
    handleMouseDown(event) {
      this.mouseState.button = event.button;
      this.mouseState.x = event.clientX;
      this.mouseState.y = event.clientY;   
      this.inputHandler.handleInput(event);         
    }
  
    handleMouseUp(event) {
      this.mouseState.button = null;
      this.mouseState.x = event.clientX;
      this.mouseState.y = event.clientY;   
      this.inputHandler.handleInput(event);           
    }
  
    handleTouchStart(event) {
      for (let touch of event.changedTouches) {
        this.touchState.set(touch.identifier, { x: touch.clientX, y: touch.clientY });
      }
    }
  
    handleTouchEnd(event) {
      for (let touch of event.changedTouches) {
        this.touchState.delete(touch.identifier);
      }
    }
  
    handleTouchMove(event) {
      for (let touch of event.changedTouches) {
        let touchState = this.touchState.get(touch.identifier);
        if (touchState) {
          touchState.x = touch.clientX;
          touchState.y = touch.clientY;
        }
      }
    }
  
    // Add methods to get the current state, e.g.:
    isKeyPressed(key) {
      return this.keyboardState.get(key) || false;
    }
  
    getMousePosition() {
      return { ...this.mouseState };
    }
  
    getTouchPositions() {
      return Array.from(this.touchState.values());
    }

    updatetMousePosition() {
        const button = this.mouseView[0];
        const x = this.mouseFloatView[1];
        const y = this.mouseFloatView[2];
        return { button, x, y };
      }
    
    updateTouchPositions() {
        const touchPositions = [];
        for (let i = 0; i < this.touchView.length; i += 3) {
          const identifier = this.touchView[i];
          const x = this.touchFloatView[i + 1];
          const y = this.touchFloatView[i + 2];
          touchPositions.push({ identifier, x, y });
        }
        return touchPositions;
      }
  }

  class InputHandler {

    constructor() {
      this.actions = {
        keyboard: {},
        mouse: {},
        touch: {}
      };
    }
  
    registerKeyboardAction(key, action) {
      this.actions.keyboard[key] = action;
    }
  
    registerMouseAction(eventName, action) {
      this.actions.mouse[eventName] = action;
    }
  
    registerTouchAction(eventName, action) {
      this.actions.touch[eventName] = action;
    }
  
    handleInput(inputEvent) {
      // Handle keyboard input
      switch(inputEvent.type){
        case 'keydown':
          if (this.actions.keyboard[inputEvent.key]) {
            this.actions.keyboard[inputEvent.key](inputEvent);
          };
        break;
        case 'mousedown':
        case 'mouseup':
        case 'mousemove':
          if(this.actions.mouse[inputEvent.type]){
            this.actions.mouse[inputEvent.type](inputEvent)          
          }
        break;        
      }
      // Handle mouse input
   /*   let mousePosition = inputController.getMousePosition();
      if (mousePosition.button !== null && this.actions.mouse[mousePosition.button]) {
        this.actions.mouse[mousePosition.button](mousePosition);
      }
  
      // Handle touch input
      let touchPositions = inputController.getTouchPositions();
      for (let touchPosition of touchPositions) {
        if (this.actions.touch[touchPosition.identifier]) {
          this.actions.touch[touchPosition.identifier](touchPosition);
        }
      }*/
    }
  }
  
  export {InputController, InputHandler}