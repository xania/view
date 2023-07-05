export type Path = string[];

export const resolve = (before: Path, segments: Path): Path => {
	if (segments.length == 0) {
		return before;
	}

	if (segments[0]) {
		const after = [...before];

		for (const segment of segments) {
			if (segment == "..") {
				after.pop();
			} else if (segment && segment != ".") {
				after.push(segment);
			}
		}
	}

	return segments.slice(1);
}
