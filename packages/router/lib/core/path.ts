export type Path = string[];

export const resolve = (before: Path, segments: Path): Path => {
	if (segments.length > 0 && segments[0]) {
		const after = [...before];

		for (const segment of segments) {
			switch (segment) {
				case "..":
					after.pop();
				case ".":
					break;
				default:
					after.push(segment);
			}
		}

		return after;
	}
	
	return segments;
}

export const toString = (path: Path): string => {
	return "/" + path.join("/");
}