import type { MapMarkersType } from "google-map-tooltips-svelte";


type TBounds = {
  east:number,north: number,south: number,west: number
}



const randNum = ({ max, min } = { max: 1, min: -1 }) =>
		max === min ? max : Math.random() * (max - min) + min;

	const generateRandCoordsInBounds = (bounds: TBounds) => {
		const lngBounds = { max: bounds.east, min: bounds.west};
		const latBounds = { max: bounds.south, min: bounds.north };
		const lat = randNum(latBounds);
		const lng = randNum(lngBounds);
		return {lat,lng};
	};

	const randMarkers = () => {
		let cachedAmount = 0;
		let cachedMarkers: MapMarkersType[] | null = null;
		return (bounds: TBounds, amount: number): MapMarkersType[] => {
			if(cachedAmount === amount && cachedMarkers) {
				return cachedMarkers;
			}
		cachedAmount = amount;
		const newMarkers = [];
		for (let i = 0; i < amount; i++) {
			newMarkers.push({
				coordinates: generateRandCoordsInBounds(bounds),
				id: `${Math.random()}`,
				priority: Math.floor(randNum({ max: 10, min: 0 })),
				name: `${Math.random()}`.slice(2, 7)
			});
		}
		cachedMarkers = newMarkers;
		return newMarkers;
	}};

export default randMarkers();