import { type StyleProp, StyleSheet, Text, type TextProps, type TextStyle } from 'react-native';

import { fonts } from '@/theme/typography';

interface Props extends Omit<TextProps, 'children'> {
  children: string;
  style?: StyleProp<TextStyle>;
}

// DESIGN.md §3: monospace is for numbers only — "Oct 26 · 10:00 AM" sets
// "26" and "10:00" in mono and leaves "Oct", "·" and "AM" in the body face.
// Labels that mix words and numerals (dates, times, "3 left") used to go
// all-mono, which put whole words in the numeral face. Digit runs, including
// the ':' and '.' inside them, are split out and nested as mono spans; the
// outer Text keeps the caller's style, so color/size stay in one place.
const NUMERAL_RUN = /(\d[\d:.,]*\d|\d)/;

export function DataText({ children, style, ...rest }: Props) {
  const parts = children.split(NUMERAL_RUN);
  return (
    <Text style={[styles.words, style]} {...rest}>
      {parts.map((part, i) =>
        // split() with a capture group puts every match at an odd index.
        i % 2 === 1 ? (
          <Text key={i} style={styles.numerals}>
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  words: {
    fontFamily: fonts.body,
  },
  numerals: {
    fontFamily: fonts.mono,
  },
});
