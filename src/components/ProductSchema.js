import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Structured data component for products or subscriptions
 * @param {Object} props Component props
 * @param {string} props.name Product name
 * @param {string} props.description Product description
 * @param {string} props.image Product image URL
 * @param {string|number} props.price Product price
 * @param {string} props.currency Currency code (default: EUR)
 * @param {string} props.availability Product availability (default: InStock)
 * @param {string} props.url Product URL
 * @param {string} props.sku Product SKU/ID
 * @param {string} props.brand Product brand (default: AudioGretel)
 * @param {string} props.priceValidUntil Date price is valid until (YYYY-MM-DD)
 */
const ProductSchema = ({
  name,
  description,
  image,
  price,
  currency = 'EUR',
  availability = 'InStock',
  url,
  sku,
  brand = 'AudioGretel',
  priceValidUntil
}) => {
  const siteUrl = 'https://audiogretel.com';
  const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;
  const fullUrl = url ? (url.startsWith('http') ? url : `${siteUrl}${url}`) : siteUrl;

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: name,
    description: description,
    image: fullImageUrl,
    category: 'Software',
    offers: {
      '@type': 'Offer',
      price: price,
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      url: fullUrl,
      ...(priceValidUntil && { priceValidUntil }),
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'ES',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 14,
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/FreeReturn'
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: '0',
          currency: currency
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 0,
            unitCode: 'DAY'
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 0,
            unitCode: 'DAY'
          }
        }
      }
    },
    ...(sku && { sku }),
    brand: {
      '@type': 'Brand',
      name: brand
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150'
    }
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
};

export default ProductSchema; 