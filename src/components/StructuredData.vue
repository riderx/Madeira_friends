<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

// Define props with default values
const props = withDefaults(defineProps<{
  type?: 'Organization' | 'WebSite' | 'Event' | 'Product';
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}>(), {
  type: 'WebSite',
  title: 'Madeira Friends | Connect with the community in Madeira',
  description: 'Join the Madeira Friends community to discover local events, find accommodations, and connect with people in Madeira, Portugal.',
  image: '/assets/madeira-social-share.jpg',
  url: '',
});

const route = useRoute();

// Calculate the full URL
const fullUrl = computed(() => {
  if (props.url) {
    return props.url.startsWith('http') ? props.url : `https://madeirafriends.com${props.url}`;
  }
  return `https://madeirafriends.com${route.fullPath}`;
});

// Generate the structured data based on the type
const structuredData = computed(() => {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': props.type,
    name: props.title,
    description: props.description,
    image: props.image.startsWith('http') 
      ? props.image 
      : `https://madeirafriends.com${props.image}`,
    url: fullUrl.value,
  };

  // Add specific properties based on type
  if (props.type === 'Organization') {
    return {
      ...baseData,
      logo: 'https://madeirafriends.com/assets/favicon/favicon.svg',
      sameAs: [
        'https://twitter.com/madeirafriends',
        'https://facebook.com/madeirafriends',
        'https://instagram.com/madeirafriends'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'contact@madeirafriends.com',
        contactType: 'customer service'
      }
    };
  } else if (props.type === 'WebSite') {
    return {
      ...baseData,
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://madeirafriends.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    };
  }

  // Default return for other types
  return baseData;
});

// Add the script tag to the head when the component mounts
onMounted(() => {
  if (import.meta.env.SSR) return; // Skip in SSR

  // Create the script tag
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.innerHTML = JSON.stringify(structuredData.value);
  
  // Add to the document head
  document.head.appendChild(script);
});
</script>

<template>
  <!-- This component doesn't render anything visible -->
</template> 
