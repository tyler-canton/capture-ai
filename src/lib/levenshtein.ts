export function levenshteinDistance(source: string, target: string): number {
  if (source.length > target.length) {
    [source, target] = [target, source];
  }

  const sourceLen = source.length;
  const targetLen = target.length;

  if (sourceLen === 0) return targetLen;
  if (targetLen === 0) return sourceLen;

  let prevRow: number[] = Array.from({ length: sourceLen + 1 }, (_, i) => i);
  let currRow: number[] = new Array(sourceLen + 1);

  for (let j = 1; j <= targetLen; j++) {
    currRow[0] = j;

    for (let i = 1; i <= sourceLen; i++) {
      const cost = source[i - 1] === target[j - 1] ? 0 : 1;
      currRow[i] = Math.min(
        prevRow[i] + 1,
        currRow[i - 1] + 1,
        prevRow[i - 1] + cost
      );
    }

    [prevRow, currRow] = [currRow, prevRow];
  }

  return prevRow[sourceLen];
}
