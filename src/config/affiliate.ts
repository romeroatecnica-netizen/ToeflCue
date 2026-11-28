export const AMAZON_AFFILIATE_TAG = 'bastelar-21';
export const AMAZON_ES_ORIGIN = 'https://www.amazon.es';

export const AFFILIATE_LINK_ATTRS = {
  target: '_blank',
  rel: 'sponsored nofollow noopener',
} as const;

export type AffiliateProductId = 'headphones' | 'ereader' | 'stand' | 'powerbank';

export interface AffiliateProductMeta {
  id: AffiliateProductId;
  searchQuery: string;
  indicativePrice: string;
  imageSrc: string;
}

export const AFFILIATE_CATALOG: Record<AffiliateProductId, AffiliateProductMeta> = {
  headphones: {
    id: 'headphones',
    searchQuery: 'auriculares inalambricos cancelacion ruido bluetooth',
    indicativePrice: '~49,99 €',
    imageSrc: '/src/assets/images/product_headphones_anc_1795877142308.jpg',
  },
  ereader: {
    id: 'ereader',
    searchQuery: 'kindle lector libros electronicos pantalla antirreflejos',
    indicativePrice: '~119,99 €',
    imageSrc: '/src/assets/images/product_ereader_tablet_1795877143593.jpg',
  },
  stand: {
    id: 'stand',
    searchQuery: 'soporte aluminio portatil plegable ergonomico',
    indicativePrice: '~24,99 €',
    imageSrc: '/src/assets/images/product_laptop_stand_1795877143438.jpg',
  },
  powerbank: {
    id: 'powerbank',
    searchQuery: 'power bank 20000mah carga rapida usb c',
    indicativePrice: '~29,99 €',
    imageSrc: '/src/assets/images/product_powerbank_usb_1795877142504.jpg',
  },
};

/**
 * Forces every Amazon recommendation link onto https://www.amazon.es
 * and appends tag=bastelar-21 regardless of input URL or search query.
 */
export function buildAmazonEsAffiliateUrl(inputUrlOrQuery: string): string {
  const trimmed = inputUrlOrQuery.trim();
  const isUrlLike = /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/');

  if (isUrlLike) {
    try {
      const parsed = new URL(trimmed, AMAZON_ES_ORIGIN);
      parsed.protocol = 'https:';
      parsed.hostname = 'www.amazon.es';
      parsed.port = '';
      parsed.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
      return parsed.toString();
    } catch {
      // Fall through to search URL if malformed
    }
  }

  const searchUrl = new URL('/s', AMAZON_ES_ORIGIN);
  searchUrl.searchParams.set('k', trimmed || 'auriculares estudio');
  searchUrl.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
  return searchUrl.toString();
}
