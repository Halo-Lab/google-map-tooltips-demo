<script lang="ts">
	import { onMount } from 'svelte';
	import type { MapMarkersType, MapMarkers as TMapMarkers } from 'google-map-tooltips-svelte';
	import { Loader } from '@googlemaps/js-api-loader';
	import type { PageData } from './$types.d.ts';
	import { goto } from '$app/navigation';
	import { load } from './+page.js';

	export let data: PageData;

	let amount = 200;
	let container: HTMLDivElement;
	let map: google.maps.Map;
	let zoom = 5;
	let center = {
		lat: 37,
		lng: -100
	};
	let markers: MapMarkersType[] = [];
	let MapMarkers: typeof TMapMarkers;
	const loader = new Loader({
		apiKey: '',
		version: 'weekly'
	});

	$: markers = data.markers;

	onMount(async () => {
		loader.load().then(async () => {
			const { Map } = (await google.maps.importLibrary('maps')) as google.maps.MapsLibrary;
			map = new Map(container, {
				zoom,
				center,
				zoomControl: true,
				panControl: true
			});
			const module = await import('google-map-tooltips-svelte');
			MapMarkers = module.MapMarkers;
		});
	});

	const onMapMove = (event: CustomEvent<{ bounds: google.maps.LatLngBounds }>) => {
		const bounds = event.detail.bounds;
		goto(`${bounds.toUrlValue()}+${amount}`);
	};

	const setAmount = () => {
		const bounds = map.getBounds();
		if (!bounds) return;
		goto(`${bounds.toUrlValue()}+${amount}`);
	};
</script>

<svelte:component this={MapMarkers} on:mapMove={onMapMove} {map} {markers} />
<div class="map" bind:this={container} />

<div class="flex items-center gap-1 justify-center mt-1 flex-col">
	<p class="text-center">
		In this demo, each event that forces recalculating of a map triggers a request for the mock <br
		/>
		data with markers within the bounds of the map. <br />
		If two markers overlap each other the one with the highest priority shows
	</p>
	<p>You can change their amount below.</p>

	<div class="flex items-center gap-2 justify-center mt-1">
		<label for="amount">Amount of popups (on whole map): </label>
		<input
			name="amount"
			id="amount"
			class="border p-1 border-black rounded-md"
			bind:value={amount}
		/>
		<button class="cursor-pointer bg-slate-100 h-8 w-12 border" on:click={setAmount}>SET</button>
	</div>
</div>

<style>
	.map {
		width: 80vw;
		height: 80vh;
		margin: auto;
	}
</style>
