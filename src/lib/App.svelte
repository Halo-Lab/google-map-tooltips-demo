<script lang="ts">
	import { onDestroy, onMount, tick, createEventDispatcher } from 'svelte';
	import type { MapMarkersType } from './types.d.ts';

	const dispatch = createEventDispatcher();

	export let map: google.maps.Map;
	export let markers: MapMarkersType[];
	const popup: Map<string, google.maps.OverlayView> = new Map();
	let popupsContainer: HTMLDivElement;
	let Popup: any;

	function mapMoves(bounds: google.maps.LatLngBounds | undefined) {
		dispatch('mapMove', { bounds });
	}

	// Check if map popup is visible
	const mapMoveHandler = () => {
		const bounds = map.getBounds();
		markers.forEach((mark, i) => {
			const currentPopup = popup.get(mark.id);
			if (!currentPopup) return;
			if (bounds?.contains(mark.coordinates)) {
				if (!currentPopup.getMap()) {
					currentPopup.setMap(map);
				}
			} else {
				if (!!currentPopup.getMap()) {
					currentPopup.setMap(null);
				}
			}
		});
		mapMoves(bounds);
	};

	$: if (markers.length && Popup) {
		// Id of all popup ids
		const popupToDelete: Set<string> = new Set(popup.keys());

		// Add new popups
		markers.forEach((mark, i) => {
			// Remove from popup SET of ids to delete
			popupToDelete.delete(mark.id);
			if (popup.has(mark.id)) return;
			// Create new popup id it doesn't exist
			const newPopup = new Popup(mark, popupsContainer);
			popup.set(mark.id, newPopup);
			newPopup.setMap(map);
		});

		// Remove all old ids
		if (popupToDelete.size > 0) {
			popupToDelete.forEach((id) => {
				popup.get(id)?.onRemove();
				popup.delete(id);
			});
		}
	}

	onMount(async () => {
		await tick();
		if (!map) {
			throw new Error("Can't find map instance");
		}
		if (!window.google) {
			throw new Error("Can't find google instance");
		}

		Popup = class extends google.maps.OverlayView {
			mark: MapMarkersType;
			popupsContainer: HTMLDivElement;
			content: HTMLDivElement;
			containerDiv: HTMLDivElement;

			constructor(mark: MapMarkersType, popupsContainer: HTMLDivElement) {
				super();
				this.mark = mark;
				this.popupsContainer = popupsContainer;
				this.content = document.createElement('div');
				this.containerDiv = document.createElement('div');

				this.content.classList.add(
					'bg-white',
					'p-1.5',
					'rounded-md',
					'-translate-x-1/2',
					'-translate-y-1/2',
					'overflow-auto',
					'max-h-16',
					'shadow-md',
					'absolute'
				);
				this.content.style.zIndex = `${mark.priority}`;
				this.content.textContent = mark.name;

				this.containerDiv.classList.add('cursor-auto', 'h-0', 'absolute');

				this.containerDiv.appendChild(this.content);

				// Optionally stop clicks, etc., from bubbling up to the map.
				Popup.preventMapHitsAndGesturesFrom(this.containerDiv);
			}

			/** Called when the popup is added to the map. */
			onAdd() {
				this.getPanes()!.floatPane.appendChild(this.containerDiv);
			}

			/** Called when the popup is removed from the map. */
			onRemove() {
				if (this.containerDiv.parentElement) {
					this.containerDiv.parentElement.removeChild(this.containerDiv);
				}
			}

			/** Called each frame when the popup needs to draw itself. */
			draw() {
				const divPosition = this.getProjection().fromLatLngToDivPixel(this.mark.coordinates)!;
				this.containerDiv.style.left = divPosition.x + 'px';
				this.containerDiv.style.top = divPosition.y + 'px';
			}
		};

		map.addListener('idle', mapMoveHandler);
	});

	onDestroy(() => {
		// Remove markers if map instance rerenders
		popup.forEach((p) => p.setMap(null));
	});
</script>

<div bind:this={popupsContainer} />
