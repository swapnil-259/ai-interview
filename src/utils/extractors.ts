import regex from './helpers/regex.js';



export function findName(text: string): string | null {

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const phoneRegex = /(\+?\d[\d\s-]{7,}\d)/;

  for (let i = 0; i < lines.length; i++) {
    if (emailRegex.test(lines[i]) || phoneRegex.test(lines[i])) {

      if (i > 0) return lines[i - 1];
    }
  }

const firstWord = lines[0]?.split(' ')[0] + " " + lines[0]?.split(' ')[1];
console.log('First word:', firstWord);
  return firstWord
}

export function findEmail(text: string) {
  const m = text.match(regex.EMAIL);
  console.log('findEmail', m);
  return m?.[0];
}

export function findPhone(text: string) {
  const m = text.match(regex.PHONE);
  console.log('findPhone', m);
  return m?.[0];
}
