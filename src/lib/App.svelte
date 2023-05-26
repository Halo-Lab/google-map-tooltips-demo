<script lang="ts">
	import { onDestroy, onMount, tick, createEventDispatcher } from 'svelte';
	import type { MapMarkersType } from './types.d.ts';

	type TElementPos = { left: number; top: number; bottom: number; right: number };

	type TPopup = google.maps.OverlayView & {
		hide: () => void;
		show: () => void;
		getPosition: () => TElementPos;
		mark: MapMarkersType;
		popupsContainer: HTMLDivElement;
		content: HTMLDivElement;
		containerDiv: HTMLDivElement;
	};

	interface ClassType<InstanceType extends {} = {}> extends Function {
		preventMapHitsAndGesturesFrom(containerDiv: HTMLDivElement): unknown;
		new (...args: any[]): InstanceType;
		prototype: InstanceType;
	}

	type IPopup = ClassType<TPopup>;

	function elementsOverlap(pos1: TElementPos, pos2: TElementPos) {
		if (!pos1 || !pos2) return false;
		return !(
			pos1.top > pos2.bottom ||
			pos1.right < pos2.left ||
			pos1.bottom < pos2.top ||
			pos1.left > pos2.right
		);
	}

	const dispatch = createEventDispatcher();

	export let map: google.maps.Map;
	export let markers: MapMarkersType[];
	export let hidePopupsThatsOutOfMap = false;
	const popup: Map<string, TPopup> = new Map();
	let popupsContainer: HTMLDivElement;
	let Popup: IPopup;

	function mapMoves(bounds: google.maps.LatLngBounds | undefined) {
		dispatch('mapMove', { bounds });
	}

	$: if (markers.length && Popup) {
		// Id of all popup ids
		const popupToDelete: Set<string> = new Set(popup.keys());

		// Add new popups
		markers.forEach((mark) => {
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

		// Fix of calling onAdd after getPosition method
		// because it returns h: 0 and w: 0 of the elemnt in this order
		requestAnimationFrame(() => {
			const popupCopy = new Map(popup);
			for (const [key1, value1] of popupCopy) {
				popup.get(key1)?.show();
				// popup.get(key1)?.show();
				for (const [key2, value2] of popupCopy) {
					if (!value1.getProjection() || !value2.getProjection()) continue;
					if (key1 === key2) continue;
					if (elementsOverlap(value1.getPosition(), value2.getPosition())) {
						if (value1.mark.priority > value2.mark.priority) {
							popup.get(key2)?.hide();
							popupCopy.delete(key2);
						} else {
							popup.get(key1)?.hide();
							popupCopy.delete(key1);
						}
					}
				}
			}
		});
	}
	// Check if map popup is visible
	const mapMoveHandler = () => {
		const bounds = map.getBounds();
		// Hide popup's thats out of map viewport
		if (hidePopupsThatsOutOfMap) {
			markers.forEach((mark) => {
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
		}
		mapMoves(bounds);
	};

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
			size: { w: number; h: number };

			constructor(mark: MapMarkersType, popupsContainer: HTMLDivElement) {
				super();
				this.mark = mark;
				this.popupsContainer = popupsContainer;
				this.content = document.createElement('div');
				this.containerDiv = document.createElement('div');
				this.size = { w: 0, h: 0 };

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

				this.content = this.containerDiv.appendChild(this.content);

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

			hide() {
				if (this.content.style.visibility !== 'hidden') {
					this.content.style.visibility = 'hidden';
				}
			}

			show() {
				if (this.content.style.visibility !== `visible`) {
					this.content.style.visibility = `visible`;
				}
			}
			getPosition() {
				const { x, y } = this.getProjection().fromLatLngToDivPixel(this.mark.coordinates) || {
					x: 0,
					y: 0
				};
				const h = this.content.offsetHeight / 2;
				const w = this.content.offsetWidth / 2;

				return {
					left: x - w,
					top: y - h,
					bottom: y + h,
					right: x + w
				};
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
