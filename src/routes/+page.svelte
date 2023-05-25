<script lang="ts">
	import { onMount } from 'svelte';
	import { MapMarkers } from '$lib/index.js';
	import type { MapMarkersType } from '$lib/types.js';

	let amount = { max: 5, min: 1 };
	let fixed = false;

	const randNum = ({ max, min }: { max: number; min: number } | undefined = { max: 1, min: -1 }) =>
		max === min ? max : Math.random() * (max - min) + min;

	const generateRandCoordsInBounds = (bounds: google.maps.LatLngBounds) => {
		const NE = bounds.getNorthEast();
		const SW = bounds.getSouthWest();
		const latBounds = { max: NE.lat(), min: SW.lat() };
		const lngBounds = { max: NE.lng(), min: SW.lng() };
		const randLat = randNum(latBounds);
		const randLng = randNum(lngBounds);
		return new google.maps.LatLng(randLat, randLng);
	};

	const randMarkers = (bounds: google.maps.LatLngBounds, amount: number) => {
		const newMarkers = [];
		for (let i = 0; i < amount; i++) {
			newMarkers.push({
				coordinates: generateRandCoordsInBounds(bounds),
				id: `${Math.random()}`,
				priority: randNum({ max: 10, min: 0 }),
				name: `${Math.random()}`.slice(2, 7)
			});
		}
		return newMarkers;
	};

	let container: HTMLDivElement;
	let map: google.maps.Map;
	let zoom = 8;
	let center = {
		lat: 40,
		lng: -73
	};
	let markers: MapMarkersType[] = [];

	onMount(async () => {
		map = new google.maps.Map(container, {
			zoom,
			center,
			zoomControl: true,
			panControl: true
		});
		const bounds = map.getBounds();
		if (!bounds) return;
		markers = randMarkers(bounds, Math.floor(randNum(amount)));
	});

	const onFixed = () => {
		amount.min = amount.max;
		fixed = !fixed;
	};

	const onAmountChange = (e: Event) => {
		const { name, value } = e.target as HTMLInputElement;
		const numValue = +value;
		const typedName = name as keyof typeof amount;
		if ((name === 'max' && numValue < amount.min) || (name === 'min' && numValue > amount.max)) {
			amount.min = numValue;
			amount.max = numValue;
			return;
		}
		amount[typedName] = numValue;
	};

	const onMapMove = (event: CustomEvent<{ bounds: google.maps.LatLngBounds }>) => {
		const bounds = event.detail.bounds;
		markers = randMarkers(bounds, Math.floor(randNum(amount)));
	};
</script>

<svelte:head>
	<script src={'https://maps.googleapis.com/maps/api/js?key='} async defer></script>
</svelte:head>

<MapMarkers on:mapMove={onMapMove} {map} {markers} />

<div class="map" bind:this={container} />

<div class="flex items-center gap-1 justify-center mt-1 flex-col">
	<p>In this demo on each event "zoom" or "drag" new markers are generated.</p>
	<p>You can change their amount below.</p>
</div>
<div class="flex items-center gap-1 justify-center mt-1">
	<label for="amount">MIN: </label>
	<input
		name="min"
		id="min"
		class="border p-1 border-black rounded-md"
		disabled={fixed}
		on:input={onAmountChange}
		value={amount.min}
	/>
	<label for="amount">MAX: </label>
	<input
		name="max"
		id="max"
		class="border p-1 border-black rounded-md"
		on:input={onAmountChange}
		value={amount.max}
	/>
	<label for="fixed">FIXED: </label>
	<input id="fixed" type="checkbox" checked={fixed} on:input={onFixed} />
</div>

<style>
	.map {
		width: 80vw;
		height: 80vh;
		margin: auto;
	}
</style>
