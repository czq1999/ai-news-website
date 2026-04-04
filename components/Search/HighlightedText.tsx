interface HighlightedTextProps {
  text: string;
  terms: string[];
  highlightClassName?: string;
}

interface Segment {
  text: string;
  matched: boolean;
}

function splitTextByTerms(text: string, terms: string[]) {
  const normalizedTerms = Array.from(new Set(terms.map((term) => term.trim()).filter(Boolean)))
    .map((term) => term.normalize('NFKC').toLowerCase())
    .sort((left, right) => right.length - left.length);

  if (!text || normalizedTerms.length === 0) {
    return [{ text, matched: false }] as Segment[];
  }

  const lowerText = text.normalize('NFKC').toLowerCase();
  const ranges: Array<{ start: number; end: number }> = [];

  normalizedTerms.forEach((term) => {
    let startIndex = 0;

    while (startIndex < lowerText.length) {
      const matchIndex = lowerText.indexOf(term, startIndex);
      if (matchIndex === -1) {
        break;
      }

      ranges.push({ start: matchIndex, end: matchIndex + term.length });
      startIndex = matchIndex + term.length;
    }
  });

  if (ranges.length === 0) {
    return [{ text, matched: false }] as Segment[];
  }

  ranges.sort((left, right) => left.start - right.start || right.end - left.end);

  const mergedRanges: Array<{ start: number; end: number }> = [];
  ranges.forEach((range) => {
    const previous = mergedRanges[mergedRanges.length - 1];

    if (!previous || range.start > previous.end) {
      mergedRanges.push({ ...range });
      return;
    }

    previous.end = Math.max(previous.end, range.end);
  });

  const segments: Segment[] = [];
  let cursor = 0;

  mergedRanges.forEach((range) => {
    if (range.start > cursor) {
      segments.push({ text: text.slice(cursor, range.start), matched: false });
    }

    segments.push({ text: text.slice(range.start, range.end), matched: true });
    cursor = range.end;
  });

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), matched: false });
  }

  return segments;
}

export default function HighlightedText({
  text,
  terms,
  highlightClassName = 'search-highlight',
}: HighlightedTextProps) {
  const segments = splitTextByTerms(text, terms);

  return (
    <>
      {segments.map((segment, index) =>
        segment.matched ? (
          <span key={`${segment.text}-${index}`} className={highlightClassName}>
            {segment.text}
          </span>
        ) : (
          <span key={`${segment.text}-${index}`}>{segment.text}</span>
        )
      )}
    </>
  );
}
