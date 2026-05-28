export function splitObservationParagraphs(text: string): string[] {
    return text
        .split(/\r?\n/)
        .map(paragraph => paragraph.trim())
        .filter(Boolean);
}

