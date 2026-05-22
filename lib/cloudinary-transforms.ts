// Named transformation recipes for <CldImage> / <CldVideoPlayer>.
// Recipes are typed prop bags spreadable directly onto next-cloudinary
// components — no string-building required. Each maps to a documented use case
// from docs/cloudinary-setup.md §8 and the per-flow docs.
//
// Usage:
//   import { STORE_LOGO_RECIPE } from '@/lib/cloudinary-transforms'
//   <CldImage src={logoUrl} {...STORE_LOGO_RECIPE} alt="..." />
//
// <CldImage> automatically applies q_auto + f_auto when `quality: 'auto'` /
// `format: 'auto'` are set, and generates responsive srcSet.

export type CloudinaryRecipe = {
  width: number
  height: number
  crop: 'fill' | 'limit' | 'fit'
  quality: 'auto'
  format: 'auto'
}

// Store logo display — square, fill-crop (the logo always shows in a square frame).
// Used: wizard preview, dashboard header, store profile, merchant search results.
export const STORE_LOGO_RECIPE: CloudinaryRecipe = {
  width: 500,
  height: 500,
  crop: 'fill',
  quality: 'auto',
  format: 'auto',
}

// Store banner display — wide hero on the store's public profile.
// Backend's banner preset accepts roughly 3:1; we render at 4:1 here per
// store-frontend-flows §7.3.
export const STORE_BANNER_RECIPE: CloudinaryRecipe = {
  width: 1600,
  height: 400,
  crop: 'fill',
  quality: 'auto',
  format: 'auto',
}

// Square product card thumbnail — search results, catalog grid.
export const SQUARE_THUMB_500_RECIPE: CloudinaryRecipe = {
  width: 500,
  height: 500,
  crop: 'fill',
  quality: 'auto',
  format: 'auto',
}

// Small inventory-table thumbnail — merchant's product list.
export const INVENTORY_THUMB_200_RECIPE: CloudinaryRecipe = {
  width: 200,
  height: 200,
  crop: 'fill',
  quality: 'auto',
  format: 'auto',
}

// Product editor preview — limit-crop preserves aspect ratio for the editor.
export const PRODUCT_EDITOR_PREVIEW_800_RECIPE: CloudinaryRecipe = {
  width: 800,
  height: 800,
  crop: 'limit',
  quality: 'auto',
  format: 'auto',
}

// Product detail page — limit-crop, large display.
export const PDP_DISPLAY_1200_RECIPE: CloudinaryRecipe = {
  width: 1200,
  height: 1200,
  crop: 'limit',
  quality: 'auto',
  format: 'auto',
}

// Video frame extraction at a specific second — used to render a still
// thumbnail for a product video in the inventory list. The video's public_id
// is passed to <CldImage> (not <CldVideoPlayer>) with this transformation.
//
// Per cloudinary-setup §8: `/image/upload/so_2,w_500,h_500,c_fill/<videoPublicId>.jpg`.
// next-cloudinary's <CldImage> accepts `rawTransformations: string[]` to inject
// arbitrary URL params.
export function videoFrameAtSecond(seconds: number, width = 500, height = 500) {
  return {
    width,
    height,
    crop: 'fill' as const,
    quality: 'auto' as const,
    format: 'auto' as const,
    rawTransformations: [`so_${seconds}`],
  }
}
