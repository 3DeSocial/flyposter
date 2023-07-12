import {identity, updateLikeStatus,  getPostsStateless, buildProfilePictureUrl, getIsFollowing } from 'deso-protocol';
import {InputController, InputHandler} from '$lib/classes/D3D_InputController.mjs';

let workers =[], inputHandler, inputController, selectedPost,currentUserStore, currentUser;
const workerURL = new URL('./workers/canvasWorker.js', import.meta.url);
const canvasWorker = new Worker(workerURL, { type: "module" });
import { writable } from 'svelte/store';	
import { json } from '@sveltejs/kit';

export const createScene = async (el, width,height, count, user) => {
  currentUser = user;
  console.log('createScene');
  console.log(user);
  return new Promise((resolve, reject) => {
    let pk = (user.publicKey)?user.publicKey:null;
    getPostImages(count, pk).then((images)=>{
      console.log('imagearray:');
console.log(images);
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

/*
const processPostImages = (images) =>{


// Trigger all three updates at the same time for each object
let promises = array.map(obj => 
  Promise.all([imgProccess1(obj), imgProccess2(obj), imgProccess3(obj)])
    .then(updatedObjects => {
      // All three updates for this object are complete
      // Perform the check and return the updated object if it passes the check
      if (checkObject(obj)) {
        return obj;
      }
    })
    .catch(error => {
      // If any request fails, catch the error and return null
      console.error(error);
      return null;
    })
);

// Wait for all objects to be updated and checked
Promise.all(promises).then(results => {
  // Filter out any null values (these are the objects that had a request fail)
  let filteredArray = results.filter(obj => obj !== null);
  console.log(filteredArray);
});

}

imgProccess1 = async (obj) =>{
  // get following status
}

imgProccess2 = async (obj) =>{
  // get followed status
}

imgProccess3 = async (obj) =>{
  // get liked status
}

imgProccess3 = async (obj) =>{
  // get diamond status
}

// Assume we have a function that checks an object
checkObject = (obj) => {
  // Is the post a comment?

  // Is Coin price > 0?

  // Is it a repost?


  // Return true if the object passes the check, false otherwise
}
*/
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
      let following = isUserFollowing(post.ProfileEntryResponse.PublicKeyBase58Check);
      let follower = isUserFollowedBy(post.ProfileEntryResponse.PublicKeyBase58Check, publicKey);      
     // let isHodling = isUserFollowedBy(post.ProfileEntryResponse.PublicKeyBase58Check, publicKey);      
    //  let isHodler = isUserFollowedBy(post.ProfileEntryResponse.PublicKeyBase58Check, publicKey);      
    console.log('following: ', following);

      console.log('follower: ', follower);

      let imgData = {url:(post.ImageURLs)?post.ImageURLs[0]:null,
                    following: following,
                    follower: follower,
                    liked: post.PostEntryReaderState.LikedByReader,
                    dimondsSent: post.PostEntryReaderState.DiamondLevelBestowed,
                    isComment: (post.ParentStakeID === '')?false:true,
                    isNFT: post.IsNFT,
                    creatorCoinPrice: post.ProfileEntryResponse.CoinPriceDeSoNanos,
                    postHashHex: post.PostHashHex,
                    description: post.Body,
                    timeStamp: post.TimestampNanos,
                    likeCount: post.likeCount,
                    userName:post.ProfileEntryResponse.Username,
                    userDesc: post.ProfileEntryResponse?.Description,
                    userPk: post.ProfileEntryResponse.PublicKeyBase58Check,
                    userProfileImgUrl: buildProfilePictureUrl(post.ProfileEntryResponse.PublicKeyBase58Check,{nodeURI:'https://node.deso.org'}) 
      };
      if((!imgData.isComment) &&
        (parseFloat(imgData.creatorCoinPrice)>0)){
        images.push(imgData);
      };

    }

  });
  return images;

  
}

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