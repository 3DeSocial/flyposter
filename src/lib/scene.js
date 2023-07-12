import {identity, updateLikeStatus,  getPostsStateless, buildProfilePictureUrl, getIsFollowing } from 'deso-protocol';
import {InputController, InputHandler} from '$lib/classes/D3D_InputController.mjs';

let workers =[], inputHandler, inputController, selectedPost,currentUserStore, currentUser;
const workerURL = new URL('./workers/canvasWorker.js', import.meta.url);
const canvasWorker = new Worker(workerURL, { type: "module" });
import { writable } from 'svelte/store';	
import { json } from '@sveltejs/kit';

export const createScene = async (el, width,height, count, user) => {
  currentUser = user;

  return new Promise((resolve, reject) => {
    let pk = (user.publicKey)?user.publicKey:null;
    getPostImages(count, pk).then((images)=>{

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

            resolve(canvasWorker);
      }).catch((err)=>{
        console.log('error getting post images');
        console.log(err);
      });
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
const getPostImages = async(count, publicKey)=>{
  let images = [];
  let posts = await getPosts(count,publicKey, 'recent');
  console.log('posts.length',posts.length);
  posts.forEach(post => {
    if(post.ProfileEntryResponse){
      let postProfile = post.ProfileEntryResponse;
    
      let imgData = {url:(post.ImageURLs)?post.ImageURLs[0]:null,
                    isComment: (post.ParentStakeID === '')?false:true,
                    isNFT: post.IsNFT,
                    creatorCoinPrice: postProfile.CoinPriceDeSoNanos,
                    postHashHex: post.PostHashHex,
                    description: post.Body,
                    timeStamp: post.TimestampNanos,
                    likeCount: post.likeCount,
                    userName:postProfile.Username,
                    userDesc: postProfile?.Description,
                    userPk: postProfile.PublicKeyBase58Check,
                    userProfileImgUrl: buildProfilePictureUrl(postProfile.PublicKeyBase58Check,{nodeURI:'https://node.deso.org'}) 
      };

      if((!imgData.isComment) &&
        (parseFloat(imgData.creatorCoinPrice)>0)){
        images.push(imgData);
      };

      if(publicKey!==null){
        let following = isUserFollowing(postProfile.PublicKeyBase58Check);
        let follower = isUserFollowedBy(postProfile.PublicKeyBase58Check, publicKey);
        let amHodling = amIHodling(postProfile,publicKey);      
        if(amHodling){
          console.log('amHodling',postProfile.PublicKeyBase58Check)
        }

    /*    let isHodler = isUserHodler(postProfile);  
        if(isHodler){
          console.log('isHodler',postProfile.PublicKeyBase58Check)
       }*/
        let userImgData = {
          following: following,
          follower: follower,
          liked: post.PostEntryReaderState.LikedByReader,
          dimondsSent: post.PostEntryReaderState.DiamondLevelBestowed,
       //   isHodler: isHodler,
          amHodling: amHodling
       };

       imgData = {...imgData, ...userImgData};
      }

    }

  });
  return images;

  
}

const amIHodling = (postProfile) =>{
  // true if post user pk is in the list of users that I hodl
  console.log('amIHodling',postProfile);
  if(currentUser.ProfileEntryResponse.UsersYouHODL===null){
    return false;
  }
  const result =  currentUser.ProfileEntryResponse.UsersYouHODL.find(obj => obj.HODLerPublicKeyBase58Check === postProfile.PublicKeyBase58Check);
  return (result)?true : false;
}
/*
const isUserHodler = (postProfile) =>{
  // true if my publicKey is in the list of users that hodl
  console.log('isUserHodler',currentUser);
  if(postProfile.UsersThatHODL===null){
    return false;
  }
  const result =  postProfile.UsersThatHODL.find(obj => obj.HODLerPublicKeyBase58Check === postProfile.UsersThatHODL);
  return (result)?true : false;
}*/

const isUserFollowing = (postPublicKey) =>{
  if(!postPublicKey){
    throw new Error('isUserFollowing: postPublicKey is null');
  };  
  return (currentUser.following.PublicKeyToProfileEntry[postPublicKey])?true : false;
}

const isUserFollowedBy = (postPublicKey) =>{
  if(!postPublicKey){
    throw new Error('isUserFollowing: postPublicKey is null');
  };
  return (currentUser.followers.PublicKeyToProfileEntry[postPublicKey])?true : false;
}

const getPosts = async (count, publicKey, feed)=>{
  let res = null;
  switch(feed){
    case 'following':
    break;
    case 'global':
    break;
    default: // recent
      res = await getPostsStateless({ReaderPublicKeyBase58Check:publicKey, NumToFetch: count});
    break;
  }
  return res.PostsFound;
}

export const startAnimation = ()=>{
  initController();
  let payload = { method: 'aninmate'};
  console.log('sending messgage aninmate');
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
    GlobalDESOLimit: 1000000, // 0.01 DESO
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