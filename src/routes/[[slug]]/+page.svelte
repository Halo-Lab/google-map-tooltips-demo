<script lang="ts">
	import { SvelteComponentTyped, onMount } from 'svelte';
	// import { MapMarkers } from 'google-map-tooltips-svelte';
	import type { MapMarkersType, MapMarkers as TMapMarkers } from 'google-map-tooltips-svelte';
	import type { PageData } from './$types.d.ts';
	import { goto } from '$app/navigation';

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

	$: markers = data.markers;

	onMount(async () => {
		async function initMap() {
			const { Map } = (await google.maps.importLibrary('maps')) as google.maps.MapsLibrary;
			map = new Map(container, {
				zoom,
				center,
				zoomControl: true,
				panControl: true
			});
			const module = await import('google-map-tooltips-svelte');
			MapMarkers = module.MapMarkers;
		}
		initMap();
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

<svelte:head>
	<script>
		((g) => {
			var h,
				a,
				k,
				p = 'The Google Maps JavaScript API',
				c = 'google',
				l = 'importLibrary',
				q = '__ib__',
				m = document,
				b = window;
			b = b[c] || (b[c] = {});
			var d = b.maps || (b.maps = {}),
				r = new Set(),
				e = new URLSearchParams(),
				u = () =>
					h ||
					(h = new Promise(async (f, n) => {
						await (a = m.createElement('script'));
						e.set('libraries', [...r] + '');
						for (k in g)
							e.set(
								k.replace(/[A-Z]/g, (t) => '_' + t[0].toLowerCase()),
								g[k]
							);
						e.set('callback', c + '.maps.' + q);
						a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
						d[q] = f;
						a.onerror = () => (h = n(Error(p + ' could not load.')));
						a.nonce = m.querySelector('script[nonce]')?.nonce || '';
						m.head.append(a);
					}));
			d[l]
				? console.warn(p + ' only loads once. Ignoring:', g)
				: (d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)));
		})({
			key: '',
			v: 'weekly'
		});
	</script>
</svelte:head>

<!-- <MapMarkers on:mapMove={onMapMove} {map} {markers} /> -->
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
