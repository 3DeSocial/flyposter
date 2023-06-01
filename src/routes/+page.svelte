<script>
	import { identity,  configure } from 'deso-protocol';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';	
	import { createScene, startAnimation } from '../lib/scene.js';
	let currentUserStore = writable(null);
	let ready = false;	
	let loading = true;
	let showUser = false;
	let showOptions = false;	
	let selectedPost = null;
	let postDateTime = null;
	let selected = ["Followers", "Following", "Seen", "Hot", "Global"];
		  
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

	onMount ((count) => {
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
		identity.subscribe((state) => {
			const event = state.event;
			if(state.currentUser){
				let currentUser = state.currentUser;
				currentUserStore.set(currentUser);
			
			}

		});
		
		createScene(el, width, height, 200).then((canvasWorker)=>{

			canvasWorker.onmessage = (message)=>{
				let data = message.data;
				switch(data.method){
					case 'hudtext':
						selectedPost = data;
						postDateTime = formatDate(parseInt(data.timeStamp) / 1000000);
						showUser = false;
					break;
					case 'ready':
						ready = true;
					break;          
					default:
						console.log('unknown message');
						console.log(data);     
					break;
				}
			};
		});
	})

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
		startAnimation()
		loading = false;
	}

	const handleLoginClick=async()=>{
		await identity.login();
		startAnimation();
		
	/*	await identity.requestPermissions({
    TransactionCountLimitMap: {
      SUBMIT_POST: 10,
	  LIKE: 1000,
	  FOLLOW: 1000
    },
  });*/
	
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
	<p>Controls<p>
	<p>Steering: W S A D</p>
	<p>Faster = R, Slower = F</p>
	{#if ready===true}	
	<h2>Login</h2>
	<button id="guest" on:click={handleGuestClick}>Guest</button>
	<!--<button id="login" on:click={handleLoginClick}>Login With DeSo</button>	-->

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
