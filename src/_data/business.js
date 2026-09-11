// LocalBusiness / CleaningService JSON-LD for the home page, built from site.json
// so the structured data can never disagree with the visible contact details.
import { readFileSync } from "node:fs";

const site = JSON.parse(readFileSync(new URL("./site.json", import.meta.url), "utf8"));

export default function () {
  const address = { "@type": "PostalAddress", addressLocality: site.address.addressLocality, addressCountry: site.address.addressCountry };
  if (site.address.streetAddress) address.streetAddress = site.address.streetAddress;
  if (site.address.postalCode) address.postalCode = site.address.postalCode;

  const business = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "CleaningService"],
    "@id": `${site.url}/#business`,
    name: site.legalName,
    alternateName: site.name,
    url: `${site.url}/`,
    logo: `${site.url}/assets/logo.png`,
    image: `${site.url}${site.ogImage}`,
    telephone: site.phoneIntl,
    email: site.email,
    vatID: site.vatId,
    priceRange: site.priceRange,
    address,
    areaServed: site.areaServed,
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: site.openingHours.days,
        opens: site.openingHours.opens,
        closes: site.openingHours.closes,
      },
    ],
    parentOrganization: { "@type": "Organization", name: site.parentCompany },
  };
  if (site.trustpilotUrl) business.sameAs = [site.trustpilotUrl];
  return business;
}
