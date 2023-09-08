/* 
 * Copyright 2019, Emanuel Rabina (http://www.ultraq.net.nz/)
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @typedef ParseCasesResult
 * @property {string[]} args
 *   A list of prepended arguments.
 * @property {Record<string,string>} cases
 *   A map of all cases.
 */

/**
 * Most branch-based type handlers are based around "cases".  For example,
 * `select` and `plural` compare compare a value to "case keys" to choose a
 * subtranslation.
 * 
 * This util splits "matches" portions provided to the aforementioned handlers
 * into case strings, and extracts any prepended arguments (for example,
 * `plural` supports an `offset:n` argument used for populating the magic `#`
 * variable).
 * 
 * @param {string} string
 * @return {ParseCasesResult}
 */
export function parseCases(string) {
	const isWhitespace = ch => /\s/.test(ch);

	const args = [];
	const cases = {};

	let currTermStart = 0;
	let latestTerm = null;
	let inTerm = false;

	let i = 0;
	while (i < string.length) {
		// Term ended
		if (inTerm && (isWhitespace(string[i]) || string[i] === '{')) {
			inTerm = false;
			latestTerm = string.slice(currTermStart, i);

			// We want to process the opening char again so the case will be properly registered.
			if (string[i] === '{') {
				i--;
			}
		}

		// New term
		else if (!inTerm && !isWhitespace(string[i])) {
			const caseBody = string[i] === '{';

			// If there's a previous term, we can either handle a whole
			// case, or add that as an argument.
			if (latestTerm && caseBody) {
				const branchEndIndex = findClosingBracket(string, i);

				if (branchEndIndex === -1) {
					throw new Error(`Unbalanced curly braces in string: "${string}"`);
				}

				cases[latestTerm] = string.slice(i + 1, branchEndIndex);  // Don't include the braces

				i = branchEndIndex; // Will be moved up where needed at end of loop.
				latestTerm = null;
			}
			else {
				if (latestTerm) {
					args.push(latestTerm);
					latestTerm = null;
				}

				inTerm = true;
				currTermStart = i;
			}
		}
		i++;
	}

	if (inTerm) {
		latestTerm = string.slice(currTermStart);
	}

	if (latestTerm) {
		args.push(latestTerm);
	}

	return {
		args,
		cases
	};
}

/**
 * Finds the index of the matching closing curly bracket, including through
 * strings that could have nested brackets.
 * 
 * @param {string} string
 * @param {number} fromIndex
 * @return {number}
 *   The index of the matching closing bracket, or -1 if no closing bracket
 *   could be found.
 */
export function findClosingBracket(string, fromIndex) {
	let depth = 0;
	for (let i = fromIndex + 1; i < string.length; i++) {
		let char = string.charAt(i);
		if (char === '}') {
			if (depth === 0) {
				return i;
			}
			depth--;
		}
		else if (char === '{') {
			depth++;
		}
	}
	return -1;
}

/**
 * Split a `{key, type, format}` block into those 3 parts, taking into account
 * nested message syntax that can exist in the `format` part.
 * 
 * @param {string} block
 * @return {string[]}
 *   An array with `key`, `type`, and `format` items in that order, if present
 *   in the formatted argument block.
 */
export function splitFormattedArgument(block) {
	return split(block.slice(1, -1), ',', 3);
}

/**
 * Like `String.prototype.split()` but where the limit parameter causes the
 * remainder of the string to be grouped together in a final entry.
 * 
 * @private
 * @param {string} string
 * @param {string} separator
 * @param {number} limit
 * @param {string[]} accumulator
 * @return {string[]}
 */
function split(string, separator, limit, accumulator = []) {
	if (!string) {
		return accumulator;
	}
	if (limit === 1) {
		accumulator.push(string);
		return accumulator;
	}
	let indexOfDelimiter = string.indexOf(separator);
	if (indexOfDelimiter === -1) {
		accumulator.push(string);
		return accumulator;
	}
	let head = string.substring(0, indexOfDelimiter).trim();
	let tail = string.substring(indexOfDelimiter + separator.length + 1).trim();
	accumulator.push(head);
	return split(tail, separator, limit - 1, accumulator);
}
