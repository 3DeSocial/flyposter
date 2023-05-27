<script>
	import { identity,  configure } from 'deso-protocol';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';	
	import { createScene, startAnimation } from '../lib/scene.js';
	let currentUserStore = writable(null);
	let readyStore = writable(false);
	let messageStore = writable("");

	let loading = true;

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
		createScene(el, width, height, 200, messageStore, imageUrl, readyStore);
	});
	//let audioSource = '/melodic-techno-03-extended-version-moogify-9867.mp3';

	const handleOKClick =()=>{
		messageStore.set('');
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
	{#if $readyStore===true}	
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
	<div style="display:none;" class="statusbar"></div>
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
	{#if $messageStore}	
		<div id="hud-content">
		<img style="max-width:6em; padding: 1em;float: left;" src={$imageUrl} alt="Image">{$messageStore}
		<div id="hud-buttons"><button on:click={handleOKClick} style="float:right; padding: 1em;" id="dismiss">OK</button></div>
		</div>
	{/if}		
</div>
