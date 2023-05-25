import { getUsersStateless, getPostsStateless, buildProfilePictureUrl } from 'deso-protocol';
import {InputController, InputHandler} from '$lib/classes/D3D_InputController.mjs';
import { VRButton } from 'https://unpkg.com/three@0.152.2/examples/jsm/webxr/VRButton.js';
let workers =[], inputHandler, inputController, canvasWorker;
const workerURL = new URL('./workers/canvasWorker.js', import.meta.url);

export const createScene = async (el, width,height, count) => {
   document.body.appendChild(VRButton.createButton());

    let images = await getPostImages(count);
    canvasWorker = new Worker(workerURL, { type: "module" });
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
  inputHandler.registerMouseAction('mousedown', (mousePosition) => {
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
  inputHandler.registerTouchAction(0, (event) => {
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

const dispatchMouse = (event) =>{
  if(!canvasWorker){
    return;
  }
  canvasWorker.postMessage({
    method: 'event',
    payload: {
        type: event.type,
        clientX: event.clientX,
        clientY: event.clientY,
    },
  });
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
