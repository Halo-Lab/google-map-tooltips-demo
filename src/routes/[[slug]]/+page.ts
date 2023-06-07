import type { TBounds, TPoint } from '$lib/types.js';
import randMarkers from '../data.js';

function inBounds(point: TPoint, bounds: TBounds) {
	const eastBound = point.lng < bounds.east;
	const westBound = point.lng > bounds.west;
	let inLong;

	if (bounds.east < bounds.west) {
		inLong = eastBound || westBound;
	} else {
		inLong = eastBound && westBound;
	}

	const inLat = point.lat > bounds.south && point.lat < bounds.north;
	return inLat && inLong;
}

const worldBounds = {
	south: -70,
	west: -170,
	north: 70,
	east: 170
};

export function load({ params }) {
	const { slug = `` } = params;
	const [bounds, amount] = slug.split('+');
	const JSONBounds: TBounds = { east: 0, north: 0, south: 0, west: 0 };
	const slugArr = bounds.split(',');
	JSONBounds.south = +slugArr[0];
	JSONBounds.west = +slugArr[1];
	JSONBounds.north = +slugArr[2];
	JSONBounds.east = +slugArr[3];

	const data = randMarkers(worldBounds, +amount);

	const markers = data.filter((d) => inBounds(d.coordinates, JSONBounds));

	return {
		markers
	};
}
