// Meta tag utilities for dynamic OG updates
export interface MetaData {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
}

export const updateMetaTags = (metadata: MetaData) => {
  // Update document title
  if (metadata.title) {
    document.title = metadata.title;
  }

  // Update or create meta tags
  const updateMetaTag = (property: string, content: string, isOgProperty = false) => {
    const selector = isOgProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
    let element = document.querySelector(selector) as HTMLMetaElement;
    
    if (!element) {
      element = document.createElement('meta');
      if (isOgProperty) {
        element.setAttribute('property', property);
      } else {
        element.setAttribute('name', property);
      }
      document.head.appendChild(element);
    }
    
    element.setAttribute('content', content);
  };

  // Update basic meta tags
  if (metadata.description) {
    updateMetaTag('description', metadata.description);
  }

  // Update Open Graph tags
  if (metadata.ogTitle) {
    updateMetaTag('og:title', metadata.ogTitle, true);
  }

  if (metadata.ogDescription) {
    updateMetaTag('og:description', metadata.ogDescription, true);
  }

  if (metadata.ogImage) {
    updateMetaTag('og:image', metadata.ogImage, true);
  }

  if (metadata.ogUrl) {
    updateMetaTag('og:url', metadata.ogUrl, true);
  }

  // Update Twitter tags
  if (metadata.ogTitle) {
    updateMetaTag('twitter:title', metadata.ogTitle);
  }

  if (metadata.ogDescription) {
    updateMetaTag('twitter:description', metadata.ogDescription);
  }

  if (metadata.ogImage) {
    updateMetaTag('twitter:image', metadata.ogImage);
  }
};

export const resetMetaTags = () => {
  // Reset to default values from index.html
  updateMetaTags({
    title: 'FairMeet — Fair Meeting Scheduler for Distributed Teams',
    description: 'Meet fairly across time zones. Rotate obligations, protect focus, and export to calendar.',
    ogTitle: 'FairMeet — Fair Meeting Scheduler',
    ogDescription: 'Rotate meeting times fairly across time zones. Demo without signup.',
    ogImage: '/og-cover-en.png',
    ogUrl: 'https://fair-time-sync.lovable.app/'
  });
};