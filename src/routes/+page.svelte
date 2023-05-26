<script>
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';	
	import { createScene } from '../lib/scene.js';
	
	let messageStore = writable("Loading...");
	let width = window.innerWidth;
  let height = window.innerHeight;

	let el;

	onMount ((count) => {
		//const audioElement = document.getElementById('audioElement');
		//audioElement.play();
		createScene(el, width, height, 200, messageStore);
	});
	let audioSource = '/melodic-techno-03-extended-version-moogify-9867.mp3';


	
	
</script>
<svelte:head>
	<title>Flyposter</title>
	<meta name="description" content="DeSo Post Discovery" />
</svelte:head>

<div class="loader-ctr" style="text-align: center;">
	<img alt="3DeSocial Logo" style="max-height: 140px; margin: 0 auto;" src="/3desocial.gif"/>
	<p>Controls<p>
	<p>Steering: W S A D</p>
	<p>Faster = R, Slower = F</p>
	<h1>Please Wait...</h1>
	<p>Loading latest posts.</p>
</div>

<div class="space-ctr" id="space-ctr">
	<div style="display:none;" class="statusbar"></div>
	<canvas v bind:this={el} id="app-canvas" style="width:100%; height: 100%;"></canvas>
		<div id="hud-content">
			{#if $messageStore}
			<div id="hud-text">{$messageStore}</div>
		  {/if}
		</div>
</div>
