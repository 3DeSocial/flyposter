import {identity, updateLikeStatus,  getPostsStateless, buildProfilePictureUrl } from 'deso-protocol';
import {InputController, InputHandler} from '$lib/classes/D3D_InputController.mjs';

let workers =[], inputHandler, inputController, selectedPost,currentUserStore;
const workerURL = new URL('./workers/canvasWorker.js', import.meta.url);
const canvasWorker = new Worker(workerURL, { type: "module" });
import { writable } from 'svelte/store';	
import { json } from '@sveltejs/kit';

export const createScene = async (el, width,height, count, messageStore, imageUrlStore, readyStore, userDesc, userPk, userName, postTimeStamp) => {
  return new Promise((resolve, reject) => {
    
   getPostImages(count).then((images)=>{

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

          width = window.innerWidth;
          height = window.innerHeight;
          let payload = { method: 'resize',
              height: height,
              width: width
            }
          canvasWorker.postMessage(payload);   
        });    
        window.dispatchEvent(new Event('resize'));      
      

        
        canvasWorker.onmessage = (message)=>{
          let data = message.data;
          switch(data.method){
            case 'hudtext':
              messageStore.set(data.description);
              imageUrlStore.set(data.userProfileImgUrl);
              selectedPost = data;
              userDesc.set(data.userDesc);
              userPk.set(data.userPk);
              userName.set(data.userName);
              let timeStamp = formatDate(parseInt(data.timeStamp) / 1000000);
              postTimeStamp.set(timeStamp);
            case 'ready':
              readyStore.set(true);
              console.log('ready');
            break;          
            default:
              console.log('unknown message');
              console.log(data);     
            break;
          }
        }

        resolve(canvasWorker);
      })
    })   


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
console.log(event.target.id);
  switch(event.target.id){
  case 'hud-content':
  break;
  case 'heart':
    if((event.type==='touchend')&&(selectedPost)){
      if(selectedPost.userPk){
        console.log('send heart to ',selectedPost.userPk);
        sendLike(selectedPost.userPk);
      }
    }     
    break;   
  case 'dismiss':
    if(event.type==='touchend'){
      canvasWorker.postMessage({
        method: 'dismiss',
        payload: {type:'dismiss'}});
    }
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
      if(event.type==='mouseup'){
        canvasWorker.postMessage({
          method: 'dismiss',
          payload: {type:'dismiss'}});
      }
    break;
    case 'heart':

        if((event.type==='mouseup')&&(selectedPost)){
          console.log('mouse heart');
          console.log(selectedPost);          
          if(selectedPost.postHashHex){
            console.log('send heart to ',selectedPost.postHashHex);
            sendLike(selectedPost.postHashHex);
          }
        }     
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
  let posts = await getPosts(count, 'recent');
  count = posts.length;
  posts.forEach(post => {
    if(post.ProfileEntryResponse){
      let imgData = {url:(post.ImageURLs)?post.ImageURLs[0]:null,
                    postHashHex: post.PostHashHex,
                    description: post.Body,
                    timeStamp: post.TimestampNanos,
                    likeCount: post.likeCount,
                    userName:post.ProfileEntryResponse?.Username,
                    userDesc: post.ProfileEntryResponse?.Description,
                    userPk: post.ProfileEntryResponse.PublicKeyBase58Check,
                    userProfileImgUrl: buildProfilePictureUrl(post.ProfileEntryResponse.PublicKeyBase58Check,{nodeURI:'https://node.deso.org'}) 
      };
      count--;
      images.push(imgData);
      
    }
    
  });
  return images;

}
const getPosts = async (count, feed)=>{
  let res = null;
  switch(feed){
    case 'following':
    break;
    case 'global':
    break;
    default: // recent
      res = await getPostsStateless({NumToFetch: count});
    break;
  }
  return res.PostsFound;
}

export const startAnimation = ()=>{
  initController();
  let payload = { method: 'aninmate'};
  console.log('sending messgage');
  console.log(canvasWorker);
canvasWorker.postMessage(payload);   
}

const sendLike = async(postHashHex)=>{

  let userData = localStorage.getItem('currentUser');
  let currentUser = JSON.parse(userData);
  if(!currentUser){
    return;
  }
  if(currentUser===null){
    console.log('not logged in ');
    return;
  }
  
 // check if the user can make a post
 if (!identity.hasPermissions({
    TransactionCountLimitMap: {
      LIKE: 100
    },
  })) {

    console.log('no permissions yet');
  // if the user doesn't have permissions, request them
  // and abort the submit
  identity.requestPermissions({
    GlobalDESOLimit: 10000000, // 0.01 DESO
    TransactionCountLimitMap: {
      LIKE: 100
    },
  });8
  return; 
}
  let likeParams = {LikedPostHashHex: postHashHex,ReaderPublicKeyBase58Check:currentUser.publicKey};
console.log(likeParams);
  await updateLikeStatus(likeParams).then((resp) => {
    console.log(resp);
  });
}

const sendPost = async()=>{
  // check if the user can make a post
  if (!identity.hasPermissions({
     TransactionCountLimitMap: {
       LIKE: 1,
     },
   })) {
   // if the user doesn't have permissions, request them
   // and abort the submit
   identity.requestPermissions({
     GlobalDESOLimit: 10000000, // 0.01 DESO
     TransactionCountLimitMap: {
       LIKE: 3,
     },
   });
   return;
 }
   
 
   await submitPost({
     UpdaterPublicKeyBase58Check: currentUser.PublicKeyBase58Check,
     BodyObj: {
       Body: body,
       ImageURLs: [],
       VideoURLs: [],
     },
   }).then((resp) => {
     console.log(resp);
     alert("Post submitted!");
   });
 }