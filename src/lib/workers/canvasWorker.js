import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';

let roadSegments =[], renderer,scene,camera, roadSegment1, roadSegment2, tunnelTexture, movementSpeed,clientWidth,clientHeight;
let cameraGroup, roadGroup = new THREE.Group(), cubes =[], updatables = [];
let centerPosition = new THREE.Vector3(0,2,8);
let selectedMesh = null;
let raycaster = new THREE.Raycaster();

// Define the target position for the camera
var targetPosition = new THREE.Vector3();
var roadWidth = 40; // Width of the road

// Define the speed of the camera movement
var cameraSpeed = 0.01;
var rotationSpeed =  0.01;
movementSpeed = 20;
var tunnelSpeed = movementSpeed/10000;



self.onmessage = function(event) {
    let payload = event.data.payload;
//   
    switch(event.data.method){
        case 'canvas':          
          initCanvas(event.data)
        break;
        case 'aninmate':
          startAnimation();
        break;
        case 'add_cube':
          addCube(event.data);
        break;
        case 'dismiss':
          dismissCurrentCube();
        break;        
        case 'resize':
          updateRendererSize(event.data);
        break;
        case 'event':
         switch(payload.type){
    
          case 'mousemove':
          break;
          case 'keydown':
            moveCamera(payload);
          break;
          case 'mousedown':
            handleTouch(payload);
          break;
          case 'touchstart':
            handleTouch(payload);
          break;                    
          default:
          break;
         };
        break;
        default:

        break;        
    }
 
};

const handleTouch = (payload)=>{

  raycastFromCamera(payload.clientX,payload.clientY);
}
const moveCamera = (payload)=>{
  let speed = 0.5;
  switch(payload.code){
    case 'KeyW':
      if(cameraGroup.position.y<40){
        cameraGroup.position.y+=speed;
      }
    break;
    case 'KeyS':
      if(cameraGroup.position.y>-40){

      cameraGroup.position.y-=speed;
    }      
    break;
    case 'KeyA':
      if(cameraGroup.position.x>-40){

      cameraGroup.position.x-=speed;
    }      
    break;
    case 'KeyD':
      if(cameraGroup.position.x<40){

      cameraGroup.position.x+=speed;      
    }      
    break;
    case 'KeyR':
      movementSpeed += 0.1;
    break;   
    case 'KeyF':
      if(movementSpeed>0){
        movementSpeed -= 0.1;
      }
    break;                                  
  }
}

const dismissCurrentCube =()=>{

  if(!selectedMesh){
    return;
  }
  // Store the parent group
  var parentGroup = selectedMesh.parent;

  // Remove the object from the group
  parentGroup.remove(selectedMesh);
          
          // The object's position is now relative to the group, so we need to adjust it to be relative to the scene
          selectedMesh.position.add(parentGroup.position);
          scene.add(selectedMesh);
  let target = getRandomCoordinates(100,800);
  updatables.push({mesh:selectedMesh,targetVector:target});
}

function getRandomCoordinates(min, max) {
  let x = Math.random() * (max - min) + min;
  let y = Math.random() * (max - min) + min;
  return new THREE.Vector3(x, y, -250);
}

const raycastFromCamera = (screenX, screenY) => {
  if(!renderer.domElement){  
    return false;
  }
  const pointer = new THREE.Vector2();

  pointer.x = ( screenX / clientWidth ) * 2 - 1;
	pointer.y = - ( screenY / clientHeight ) * 2 + 1

  raycaster.setFromCamera( pointer, camera );


  let intersects = [];

  roadSegments.some(segment => {
    intersects = raycaster.intersectObjects(segment.children, true);
    return intersects.length > 0;  // This will stop the loop if intersects.length > 0
  });
  
if(intersects.length){
  dismissCurrentCube();
  checkAndRemoveFromGroup(intersects[0].object);
};
  return intersects;
}

const checkAndRemoveFromGroup = (intersectedObject) => {
  // Check if the intersected object has a parent
  if (intersectedObject.parent) {
      // Check if the parent is a group
      if (intersectedObject.parent.type='Group') {
          // Store the parent group
          var parentGroup = intersectedObject.parent;
        
          // Remove the object from the group
          parentGroup.remove(intersectedObject);

          // The object's position is now relative to the group, so we need to adjust it to be relative to the scene
          intersectedObject.position.add(parentGroup.position);

          // Add the object directly to the scene
          scene.add(intersectedObject);
          selectedMesh = intersectedObject;
          centerPosition.x = camera.position.x;
          centerPosition.y = camera.position.y+4;
          centerPosition.z = camera.position.z-20;
        if(intersectedObject.userData.imageData){
          displayPost(intersectedObject.userData.imageData)
          };
      }
  }
}

const displayPost = (postData) =>{
  postData.method = 'hudtext';
  self.postMessage(postData);
  /*  let minDistance = 5;
    let inputText = postData.description;
    // Remove the old text from the group if it exists
    let oldText = cameraGroup.getObjectByName('hudText');
    if (oldText) {
      cameraGroup.remove(oldText);
    }
  
    // Create a new Text instance and set its properties
    let text = new Text();
    text.name = 'hudText'; // Set a name so we can find it later
    text.text = inputText;
    text.fontSize = 0.1;
    text.color = 0xff0000;
    text.position.set(0, 0, minDistance); // Position the text in front of the camera
  
    // Add the text to the group
    cameraGroup.add(text);
  
    // Update the text layout
    text.sync();
  */
  
}
const initCanvas=(d)=>{
  console.log('initCanvas',d);
    const canvas = d.canvas;
    const innerWidth = d.width;
    const innerHeight = d.height;  
    const images = d.images;
    const devicePixelRatio = d.devicePixelRatio;
    renderer = new THREE.WebGLRenderer( { canvas:canvas } );
    renderer.setPixelRatio( devicePixelRatio );    

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 1000);
    cameraGroup = new THREE.Group();
    cameraGroup.add(camera);
    scene.add(cameraGroup)
    createTunnel();
    // Position camera
    // Position camera
    cameraGroup.position.x = 0; // Height similar to a car
    cameraGroup.position.y = 0.1; // Height similar to a car
    cameraGroup.position.z = 0; // Start at the beginning of the road
    // Make the camera look towards negative z
    cameraGroup.lookAt(new THREE.Vector3(0, 0,1));

    addRoadSegments(images);
    self.postMessage({method:'ready'})
    

}

const startAnimation = () =>{

  var clock = new THREE.Clock();
  startCubeAnimation()
  startTunnelAnimation();

  const animate = function () {

    for (let i = updatables.length - 1; i >= 0; i--) { 
      const {mesh, targetVector} = updatables[i];
      if(mesh.position){
      if (mesh.position.distanceTo(targetVector) > 1) {
        // Move the selectedMesh towards the target position
        mesh.position.lerp(targetVector, cameraSpeed);
      } else {
        updatables.splice(i, 1);
      }
    }
  }

  if (selectedMesh){
      // Generate a new target position if the camera is close to the current target
      if (selectedMesh.position.distanceTo(centerPosition) > 1) {
        // Move the selectedMesh towards the target position
        selectedMesh.position.lerp(centerPosition, cameraSpeed);
      }
  }
  
    // Update the time uniform of the shader material
  // material.uniforms.time.value = clock.getElapsedTime();
  if(renderer){
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
};  

animate()
}

const startCubeAnimation = () =>{
  setInterval(() => {
    cubes.forEach((cube) => {
      switch(cube.userData.direction){
        case 0:
          cube.rotation.y -= rotationSpeed;
          break
        case 1:
          cube.rotation.y += rotationSpeed;
          break      
        case 3:
          cube.rotation.x += rotationSpeed;
          break           
      }
    });
  }, 1000 / 60);
}
  
const startTunnelAnimation = () =>{
  setInterval(() => {
    if(tunnelTexture){
      // Move road segments
      tunnelTexture.offset.y -= tunnelSpeed;
      tunnelTexture.offset.x -= (tunnelSpeed/2);
      roadSegments.forEach((roadSegment, i) => {
        roadSegment.position.z += 0.1;
  
        let nextRoadSegment = roadSegments[(i + 1) % roadSegments.length];
        if (roadSegment.position.z > camera.position.z + 500) {
          roadSegment.position.z = nextRoadSegment.position.z - 500;
          console.log('move road segment');
        }
      })
    }
  }, 1000 / 60);
}

const addCube = () =>{
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  
  scene.add(cube);
  cubes.push(cube);
}

const addRoadSegments = async(images) => {
  for (var i = 0; i < 2; i++) {
    var roadSegment = new THREE.Group();

    roadSegment.position.z = i === 0 ? 0 : -1000; // Position road segments

    scene.add(roadSegment);
    roadSegments.push(roadSegment);
  }

  addCubesToSegments(images).then((images) => {

    positionCubes(images);
  }).catch((error) => {
    // Handle any errors that occurred during promise execution
    console.error('Some posts could not be loaded:', error);
  });
}


const addCubesToSegments = (images) => {
  let promises = images.map((image) => {
    try {
      if (image.url) {
        if (!image.url.toLowerCase().endsWith('.gif')) {
          return loadImage(image);
        }
      } else {
        return loadImage(image);
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }).filter(Boolean);

  return Promise.allSettled(promises)
    .then((results) => {
      const resolvedValues = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);

      const rejectedErrors = results
        .filter((result) => result.status === 'rejected')
        .map((result) => result.reason);

      // Return the resolved values or perform additional processing
      return resolvedValues;
    });
};


const positionCubes = (images)=>{
  let segment = 0;
  var cubeSize = 8; // Size of the cube
  var minDistance = 10; // Minimum distance between cubes  
  var gridSize = cubeSize + minDistance; // Size of each grid cell
  var roadWidth = 50; // Width of the road
  var roadLength = 1000; // Length of the road
  var grid = new Array(Math.ceil(roadWidth / gridSize) * Math.ceil(roadLength / gridSize)).fill(false);
  var maxAttempts = 100; // Maximum number of attempts to find an unoccupied cell
  
  images.forEach((image, idx)=>{
    let roadSegment = roadSegments[segment];
    segment = (segment===0)?1:0;
      let cube = createCube(image, cubeSize);
      if(cube){
      var cellIndex;
      var attempts = 0;
      // Try to find an unoccupied cell
      do {
          cellIndex = Math.floor(Math.random() * grid.length);
          attempts++;
      } while (grid[cellIndex] && attempts < maxAttempts);

      if (!grid[cellIndex]) {
          var cellX = (cellIndex % Math.ceil(roadWidth / gridSize)) * gridSize + gridSize / 2 - roadWidth / 2;
          var cellZ = Math.floor(cellIndex / Math.ceil(roadWidth / gridSize)) * gridSize - roadLength / 2;

          cube.position.x = cellX;
          cube.position.y = (Math.random() - 0.5) * roadWidth; // Random y position for variation
          cube.position.z = cellZ;
          cube.rotation.x = Math.PI;

          grid[cellIndex] = true;
          if(cube.userData.imageData.url===null){
            cube.userData.direction = 3;
          } else {
            var randomInt = Math.floor(Math.random() * 2) + 1;

            cube.userData.direction = randomInt;
          }
          cubes.push(cube);
          roadSegment.add(cube);
        }
      }
    
  })
}

const createCube = (image,cubeSize)=>{
  let imgTexture = image[0];
  let userTexture = image[1];
  let imageData = image[2];

  if(!imgTexture){
    return false;
  };
  if(!userTexture){
    return false;
  };
   var cubeMaterial = new THREE.MeshBasicMaterial({map:imgTexture});        
   var userMaterial = new THREE.MeshBasicMaterial({map:userTexture});        

        // Calculate scale factor
        let scaleFactor = cubeSize / imgTexture.image.height;

        // Calculate new dimensions
        let newWidth = imgTexture.image.width * scaleFactor;
        let newHeight =cubeSize; // Maximum height is 4
        let newDepth = newWidth; // Assuming depth is the same as width
        var cubeGeometry = new THREE.BoxGeometry(newWidth, newHeight, newDepth);
        
        // Get the array of UVs.
        var uvs = cubeGeometry.attributes.uv.array;

        // Loop through the UVs and flip the x-coordinate.
        for (var i = 0; i < uvs.length; i += 2) {
            uvs[i] = 1 - uvs[i];
        }

        // Tell Three.js to update the UVs on the GPU.
        cubeGeometry.attributes.uv.needsUpdate = true;

        // Create materials for each face of the cube
        var cubeMaterials = [
          cubeMaterial, // Right side
          cubeMaterial, // Left side
          userMaterial, // Top side
          userMaterial, // Bottom side
          cubeMaterial, // Front side
          cubeMaterial  // Back side
        ];
        
        let cube = new THREE.Mesh(cubeGeometry, cubeMaterials);
        cube.userData.imageData = imageData;
        if(imageData.direction = 3){
          cube.rotation.y = Math.PI;

        }
        return cube;
}

const loadImage = async (image)=>{
  let imgTexture;
  if(image.url){
    var response = await fetch('/api/image-proxy?url='+image.url);
    var blob = await response.blob();
    let bitmap = await createImageBitmap(blob);
    imgTexture = new THREE.Texture(bitmap);
    imgTexture.needsUpdate = true;
  }
  var userResponse = await fetch('/api/image-proxy?url='+image.userProfileImgUrl);
  var userBlob = await userResponse.blob();
  let userBitmap = await createImageBitmap(userBlob);
  var userTexture = new THREE.Texture(userBitmap);
  userTexture.needsUpdate = true;  
  if(!image.url){
    imgTexture = new THREE.Texture(userBitmap);
    imgTexture.needsUpdate = true;
  }
  return [imgTexture, userTexture, image];
}

const createTunnel =async () =>{
  let textures = ['/textures/psychedelic-stripes.png',
                  '/textures/circuits-1.png',
                  '/textures/circuits-2.png',
                  '/textures/circuits-3.png',
                  '/textures/sl_031420_28950_10.jpg',
                  '/textures/17266.jpg', 
                  '/textures/scifi_surface.jpg',
                  '/textures/alien-planet.png',
                  '/textures/flames1.png']

  let noTextures = textures.length-1;
  var randomInt = Math.floor(Math.random() * noTextures);
  let textureUrl = textures[randomInt]
  var response = await fetch(textureUrl);
  var blob = await response.blob();
  var bitmap = await createImageBitmap(blob);
      tunnelTexture = new THREE.Texture(bitmap);
      tunnelTexture.needsUpdate = true;
      tunnelTexture.wrapS = tunnelTexture.wrapT = THREE.RepeatWrapping;
  var material = new THREE.MeshBasicMaterial({map:tunnelTexture, side: THREE.BackSide });        

var geometry = new THREE.CylinderGeometry(60, 60, 1000, 32, 1, true);
var mesh = new THREE.Mesh(geometry, material);
mesh.rotation.x = Math.PI/2;
mesh.position.z = -500;
scene.add(mesh);

}


const updateRendererSize = (d)=> {

  if(!renderer.domElement){  
    return;
  }
  if(!camera){  
    return;
  }
  const canvas = renderer.domElement;
  if(!canvas){  
    return;
  }
  const width = d.width;
  const height = d.height;
  clientWidth = width;
  clientHeight = height;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    camera.aspect =width /height;
    camera.updateProjectionMatrix();    
    renderer.setSize(width, height, false);
   }
  
  return needResize;
}
