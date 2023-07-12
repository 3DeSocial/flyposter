<script>
	import { identity,  configure, getUsernameForPublicKey, buildProfilePictureUrl, getFollowersForUser  } from 'deso-protocol';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';	
	import { createScene, startAnimation } from '../lib/scene.js';
  	import { UnsignedShortType } from 'three';
	let currentUserStore = writable(null);
	let currentUser = null;
	let userName = null
	let profileURL = null
	let ready = false;	
	let loading = true;
	let loggedIn = false;
	let showUser = false;
	let showOptions = false;	
	let selectedPost = null;
	let postDateTime = null;
	let selected = ["Followers", "Following", "Seen", "Hot", "Global"];
	let initialized = false;
	let noImages = 20;
	const handleChange = () => {
		console.log(selected);  // Output the values of the checked checkboxes
	};
	function toggleOptions() {
		showOptions = !showOptions;
	}
	function toggleUser() {
		showUser = !showUser;
	}
// Create a writable store with a default value
	let imageUrl = writable('');	
	let width = window.innerWidth;
  	let height = window.innerHeight;

	let el;

	onMount (async (count) => {
		//const audioElement = document.getElementById('audioElement');
		//audioElement.play();
		configure({
			spendingLimitOptions: {
			// NOTE: this value is in Deso nanos, so 1 Deso * 1e9
			GlobalDESOLimit: 10 * 1e9, // 1 Deso
			// Map of transaction type to the number of times this derived key is
			// allowed to perform this operation on behalf of the owner public key
			TransactionCountLimitMap: {
			BASIC_TRANSFER: 100, // 2 basic transfer transactions are authorized
			SUBMIT_POST: 10,
			LIKE: 100,
			FOLLOW: 100
			}
			}
		})

		// check identity for already logged in user
		identity.subscribe( async (state) => {
			const event = state.event;
				if(state.currentUser){
					currentUser = await getCurrentUser(state.currentUser);
					if(currentUser){
						userName =currentUser.Username;
						await getCurrentUserData(currentUser);
					}
					
				}
			

		});
		
		// check identity for already logged in user
		currentUser = await getCurrentUser();
		if(currentUser){

			if(currentUser){
				await getCurrentUserData(currentUser);
			}
			
			loggedIn = true;
			createScene(el, width, height, 60, currentUser).then((canvasWorker)=>{

				canvasWorker.onmessage = (message)=>{
					let data = message.data;
					switch(data.method){
						case 'hudtext':
							selectedPost = data;
							postDateTime = formatDate(parseInt(data.timeStamp) / 1000000);
							showUser = false;
						break;
						case 'ready':
							console.log('ready');
							ready = true;
						break;          
						default:
							console.log('unknown message');
							console.log(data);     
						break;
					}
				};
			});
		};
	})

	const getCurrentUserData = async (currentUser) =>{
		let getFollowerParams = {PublicKeyBase58Check: currentUser.publicKey,
								Username:currentUser.Username,
								GetEntriesFollowingUsername: true,
								NumToFetch: 10000000
								};
		currentUser.followers = await getFollowersForUser(getFollowerParams);

		let getFollowingParams = {PublicKeyBase58Check: currentUser.publicKey,
							Username:currentUser.Username,
								GetEntriesFollowingUsername: false,
								NumToFetch: 10000000
								};
		currentUser.following = await getFollowersForUser(getFollowingParams);

		loggedIn = true;		
	}
	const formatDate =(date) =>{
		const options = { year: 'numeric', month: 'long', day: 'numeric' };
		let formatted = new Date(date).toLocaleDateString('en', options)+ ' at '+new Date(date).toLocaleTimeString('en-gb');
		if(formatted ==='Invalid Date'){
		} else {
			return formatted;
		}
	}

	const handleProfileClick=()=>{
		toggleUser();
    // You can add more code here to handle the button click
  	}
	const handleOKClick =()=>{
		selectedPost = null;
    // You can add more code here to handle the button click
  	}
	const handleGuestClick=()=>{
		currentUser = {'Username':'Guest'};
		startAnimation();
	}

	const handleLoginClick=async()=>{
		await identity.login();
		startAnimation();
		loading = false;		
	/*	await identity.requestPermissions({
    TransactionCountLimitMap: {
      SUBMIT_POST: 10,
	  LIKE: 1000,
	  FOLLOW: 1000
    },
  });*/
	
	}

	const handleLogOutClick=async()=>{
		await identity.logout();
		loggedIn = false;	
	/*	await identity.requestPermissions({
    TransactionCountLimitMap: {
      SUBMIT_POST: 10,
	  LIKE: 1000,
	  FOLLOW: 1000
    },
  });*/
	
	}

	const handleStart = () =>{
		startAnimation()
		loading = false;
	}
	const getCurrentUser = async (user) =>{
		if(!user){
			const state = identity.snapshot();
			if (state.currentUser) {
				user = state.currentUser;
			} else {
				// no current user
				return false;
			}
		} 
		return await getUserData(user);
	}

	const getUserData = async (user)=>{
		user.Username = await getUsernameForPublicKey(user.publicKey);
		user.profileURL = buildProfilePictureUrl(user.publicKey,{nodeURI:'https://node.deso.org'});
		profileURL = user.profileURL;
		return user;
	}

	const convertUrlsToLinks = (text)=> {
    	const urlRegex = /(\b(?:https?|ftp):\/\/[^\s]+)/g;
    	return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
	  }	
	
</script>
<svelte:head>
	<title>Flyposter</title>
	<meta name="description" content="DeSo Post Discovery" />
</svelte:head>
{#if loading===true}	
<div class="loader-ctr" style="text-align: center;">
	<img alt="3DeSocial Logo" style="max-height: 140px; margin: 0 auto;" src="/3desocial.gif"/>
	{#if loggedIn && userName!==null && profileURL!==null}
		<h1>Welcome</h1>
		<p>You are logged in as {userName}</p>
		<div><img src="{profileURL}"/></div>
		
		<button id="logout" on:click={handleLogOutClick}>Log Out</button>

	{:else}
		<h1>Please Log in</h1>
		<button id="guest" on:click={handleGuestClick}>Guest</button>
		<button id="login" on:click={handleLoginClick}>Login With DeSo</button>
	{/if}

	{#if ready===true}	
		<h2>Controls</h2>
		<p>Steering: W S A D</p>
		<p>Faster = R, Slower = F</p>
		<button on:click={handleStart}>Start</button>
	{:else}
		<h1>Please Wait...</h1>
		<p>Loading latest posts.</p>	
	{/if}
</div>
{/if}
<div class="space-ctr" id="space-ctr">
	<div class="statusbar" style="color: #fff; background-color:black">
		<button id="options" style="width: 8em;padding: 0.5em 0em;" on:click|stopPropagation|preventDefault={toggleOptions}>Options</button>
		{#if showOptions===true}	

		<div>
			<form  style="display: inline-block">
				<input type="checkbox" bind:group={selected} value="Followers" on:change={handleChange} id="followers">
				<label for="followers">Followers</label><br>
				
				<input type="checkbox" bind:group={selected} value="Following" on:change={handleChange} id="following">
				<label for="following">Following</label><br>
				
				<input type="checkbox" bind:group={selected} value="Seen" on:change={handleChange} id="seen">
				<label for="seen">Seen</label><br>
				
				<input type="checkbox" bind:group={selected} value="Hot" on:change={handleChange} id="hot">
				<label for="hot">Hot</label><br>
				
				<input type="checkbox" bind:group={selected} value="Global" on:change={handleChange} id="global">
				<label for="global">Global</label><br>

			  </form>			
		</div>
		{/if}
	</div>
	{#if loading===false}	
	{#if $currentUserStore != null}	
	<!--<div id="control-btns"><ul>
			<li><img id="heart" src="/images/heart.png"/></li>
			<li><img id="diamond" src="/images/diamond.png"/></li>
		</ul>
	</div>-->
	{/if}
	{/if}
	<canvas v bind:this={el} id="app-canvas" style="width:100%; height: 100%;"></canvas>
	{#if selectedPost!==null}	
		<div id="hud-content">
		<figure style="max-width:6em; padding: 0;margin: 0em 1em; float: left;">
		<img on:click|stopPropagation={handleProfileClick} style="" src={selectedPost.userProfileImgUrl} alt="Image"/>
		<figcaption>{selectedPost.userName}</figcaption>
		</figure>
		{#if showUser}
		<p id="user-description" style="display: inline; padding-top: 1em;">{@html convertUrlsToLinks(selectedPost.userDesc)}</p>
		{:else}
				
		<p id="post-description" style="display: inline; padding-top: 1em;"><time>Posted {postDateTime}</time><br/><br/>{@html convertUrlsToLinks(selectedPost.description)}</p>		
		{/if}	
		<div id="hud-buttons"><button on:click|stopPropagation={handleOKClick} style="float:right; padding: 1em;" id="dismiss">OK</button></div>
		</div>
	{/if}		
</div>
