export const fontFamilies = {
  cinzelDecorative: 'CinzelDecorative-Regular',
  cinzelDecorativeBold: 'CinzelDecorative-Bold',
  cinzelDecorativeBlack: 'CinzelDecorative-Black',
  cinzel: 'Cinzel-Regular',
  cinzelMedium: 'Cinzel-Medium',
  cinzelSemiBold: 'Cinzel-SemiBold',
  cinzelBold: 'Cinzel-Bold',
  cinzelExtraBold: 'Cinzel-ExtraBold',
  cinzelBlack: 'Cinzel-Black',
  inter: 'Inter',
  mono: 'JetBrainsMono-Regular',
} as const

export const fontSize = {
  hero: 44,
  xl: 28,
  lg: 22,
  md: 16,
  sm: 13,
  xs: 11,
  '2xs': 9,
} as const

export const fontWeight = {
  900: '900',
  800: '800',
  700: '700',
  600: '600',
  500: '500',
  400: '400',
} as const

// Convenience presets
export const text = {
  hero: { fontFamily: fontFamilies.cinzelDecorative, fontSize: fontSize.hero, fontWeight: fontWeight[700] },
  heading: { fontFamily: fontFamilies.cinzelBold, fontSize: fontSize.xl, fontWeight: fontWeight[700] },
  subheading: { fontFamily: fontFamilies.cinzelSemiBold, fontSize: fontSize.lg, fontWeight: fontWeight[600] },
  body: { fontFamily: fontFamilies.inter, fontSize: fontSize.md, fontWeight: fontWeight[400] },
  label: { fontFamily: fontFamilies.cinzel, fontSize: fontSize.sm, fontWeight: fontWeight[500] },
  caption: { fontFamily: fontFamilies.inter, fontSize: fontSize.xs, fontWeight: fontWeight[400] },
  mono: { fontFamily: fontFamilies.mono, fontSize: fontSize.sm, fontWeight: fontWeight[400] },
} as const
