import { getUsersStateless, getPostsStateless, buildProfilePictureUrl } from 'deso-protocol';
import {InputController, InputHandler} from '$lib/classes/D3D_InputController.mjs';
let workers =[], inputHandler, inputController;
const workerURL = new URL('./workers/canvasWorker.js', import.meta.url);
const canvasWorker = new Worker(workerURL, { type: "module" });


export const createScene = async (el, width,height, count, messageStore) => {


    let images = await getPostImages(count);

    const offscreen = el.transferControlToOffscreen();

    
    let payload = { 
        method: 'canvas',
        canvas: offscreen,
        height: height,
        width: width,
        images: images,
        devicePixelRatio: window.devicePixelRatio
      }


    canvasWorker.postMessage(payload, [offscreen]);



    window.addEventListener('resize', (e) => {

        let canvas = document.getElementById('app-canvas');
        width = window.innerWidth;
        height = window.innerHeight;
        let payload = { method: 'resize',
            height: height,
            width: width
          }
        canvasWorker.postMessage(payload);   
      });    
      window.dispatchEvent(new Event('resize'));      
    
      initController();
       
      canvasWorker.onmessage = (message)=>{
        let data = message.data;
        switch(data.method){
          case 'hudtext':
            messageStore.set(data.description);
          break;
          default:
            console.log('unknown message');
            console.log(data);     
          break;
        }
      }   
}

const initController =() =>{

  inputHandler = new InputHandler();
  inputController = new InputController({inputHandler: inputHandler});
  // Register keyboard action for the 'A' key
  inputHandler.registerKeyboardAction('w', (event) => {
    dispatchKeys(event)
  });

  inputHandler.registerKeyboardAction('s', (event) => {
    dispatchKeys(event)
  });

  inputHandler.registerKeyboardAction('a', (event) => {
    dispatchKeys(event)
  });

  inputHandler.registerKeyboardAction('d', (event) => {
    dispatchKeys(event)
  });

  inputHandler.registerKeyboardAction('r', (event) => {
    dispatchKeys(event)
  });
  
  inputHandler.registerKeyboardAction('f', (event) => {
    dispatchKeys(event)
  });  

  // Register mouse action for the left mouse button (button 0)
  inputHandler.registerMouseAction('mousedown', (event) => {
    dispatchMouse(event);    
  });

  // Register mouse action for the left mouse button (button 0)
  inputHandler.registerMouseAction('mouseup', (event) => {
    dispatchMouse(event);
  });
  
  // Register mouse action for the left mouse button (button 0)
  inputHandler.registerMouseAction('mousemove', (event) => {
    dispatchMouse(event);
  });  

  // Register touch action for the first touch point (identifier 0)
  inputHandler.registerTouchAction('touchstart', (event) => {
    dispatchTouch(event);
  });

}

const dispatchKeys = (event) =>{
  if(!canvasWorker){
    return;
  }
  canvasWorker.postMessage({
    method: 'event',
    payload: {
        type: event.type,
        key: event.key,
        keyCode: event.keyCode,
        code: event.code
    },
  });
}

const dispatchTouch = (event) =>{
  if(!canvasWorker){
    return;
  }

  switch(event.target.id){
  case 'hud-content':
  break;
  case 'dismiss':
    canvasWorker.postMessage({
      method: 'event',
      payload: {type:'dismiss'}});
  break;
  default:
    const touch = event.changedTouches[0];


    canvasWorker.postMessage({
      method: 'event',
      payload: {
          type: event.type,
          clientX: touch.clientX,
          clientY: touch.clientY,
          pageX: touch.pageX,
          pageY: touch.pageY,
          radiusX: touch.radiusX,
          radiusY: touch.radiusY,
          screenX: touch.screenX,
          screenY: touch.screenY             
      },
    });    
  break;
}

}

const dispatchMouse = (event) =>{
  if(!canvasWorker){
    return;
  }

  switch(event.target.id){
    case 'hud-content':
    break;
    case 'dismiss':
      canvasWorker.postMessage({
        method: 'event',
        payload: {type:'dismiss'}});
    break;
    default:
      canvasWorker.postMessage({
        method: 'event',
        payload: {
            type: event.type,
            clientX: event.clientX,
            clientY: event.clientY,
        },
      });
    break;
  }
}
const getPostImages = async(count)=>{
  let images = [];
  let posts = await getPosts(count);
  count = posts.length;
  posts.forEach(post => {
    if(post.ImageURLs!==null&&(post.ProfileEntryResponse)){
      let imgData = {url:post.ImageURLs[0],
                    description: post.Body,
                    user:post.ProfileEntryResponse?.Username,
                    userDesc: post.ProfileEntryResponse?.Description,
                    userPk: post.ProfileEntryResponse.PublicKeyBase58Check,
                    userProfileImgUrl: buildProfilePictureUrl(post.ProfileEntryResponse.PublicKeyBase58Check,{nodeURI:'https://node.deso.org'}) 
      };
      count--;
      if((imgData.url!='')&&(imgData.url!=null)){
        images.push(imgData);
      }
    }
    
  });
  return images;

}
const getPosts = async (count)=>{
  let res = await getPostsStateless({NumToFetch: count, MediaRequired: true});
  return res.PostsFound;
}
