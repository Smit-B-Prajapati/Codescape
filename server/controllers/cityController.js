/**
 * Curated City Destination Dataset
 * Static/Curated destination database for instant city discovery and stop planning.
 */
export const CITIES_DATASET = [
  {
    id: 'city_mumbai',
    city: 'Mumbai',
    country: 'India',
    region: 'South Asia',
    costIndex: 'Moderate',
    popularity: 4.8,
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80',
    description: 'Bustling coastal metropolis known for Gateway of India, street food, and vibrant culture.',
  },
  {
    id: 'city_goa',
    city: 'Goa',
    country: 'India',
    region: 'South Asia',
    costIndex: 'Moderate',
    popularity: 4.9,
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
    description: 'Tropical paradise featuring golden beaches, Portuguese heritage churches, and nightlife.',
  },
  {
    id: 'city_ahmedabad',
    city: 'Ahmedabad',
    country: 'India',
    region: 'South Asia',
    costIndex: 'Budget',
    popularity: 4.5,
    image: 'https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=800&q=80',
    description: 'UNESCO World Heritage city famous for Sabarmati Riverfront, Ashram, and historic architecture.',
  },
  {
    id: 'city_bangalore',
    city: 'Bangalore',
    country: 'India',
    region: 'South Asia',
    costIndex: 'Moderate',
    popularity: 4.6,
    image: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80',
    description: 'Garden City known for tech hubs, craft breweries, and pleasant year-round climate.',
  },
  {
    id: 'city_paris',
    city: 'Paris',
    country: 'France',
    region: 'Western Europe',
    costIndex: 'Luxury',
    popularity: 4.9,
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    description: 'The City of Light, world-class museums, cafes, and historic architecture.',
  },
  {
    id: 'city_kyoto',
    city: 'Kyoto',
    country: 'Japan',
    region: 'East Asia',
    costIndex: 'High',
    popularity: 4.9,
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    description: 'Cultural heart of Japan with thousands of classical Buddhist temples and shrines.',
  },
  {
    id: 'city_tokyo',
    city: 'Tokyo',
    country: 'Japan',
    region: 'East Asia',
    costIndex: 'High',
    popularity: 4.9,
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',
    description: 'Ultramodern metropolis blending neon skyscrapers with historic temples.',
  },
  {
    id: 'city_santorini',
    city: 'Santorini',
    country: 'Greece',
    region: 'Southern Europe',
    costIndex: 'Luxury',
    popularity: 4.9,
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
    description: 'Breathtaking volcanic island with white cliffside villages and Aegean sunsets.',
  },
  {
    id: 'city_bali',
    city: 'Bali',
    country: 'Indonesia',
    region: 'Southeast Asia',
    costIndex: 'Budget',
    popularity: 4.8,
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
    description: 'Tropical paradise featuring rice terraces, coral reefs, and spiritual temples.',
  },
  {
    id: 'city_rome',
    city: 'Rome',
    country: 'Italy',
    region: 'Southern Europe',
    costIndex: 'High',
    popularity: 4.8,
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80',
    description: 'The Eternal City home to Colosseum, Vatican City, and millennia of history.',
  },
  {
    id: 'city_london',
    city: 'London',
    country: 'United Kingdom',
    region: 'Western Europe',
    costIndex: 'Luxury',
    popularity: 4.8,
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
    description: 'Historic capital featuring Big Ben, Royal Parks, and iconic West End theaters.',
  },
  {
    id: 'city_dubai',
    city: 'Dubai',
    country: 'United Arab Emirates',
    region: 'Middle East',
    costIndex: 'Luxury',
    popularity: 4.7,
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    description: 'Futuristic desert city famous for luxury shopping, Burj Khalifa, and nightlife.',
  },
];

/**
 * @route   GET /api/cities
 * @desc    Search and filter curated travel cities dataset
 * @access  Public / Private
 */
export const getCities = async (req, res) => {
  try {
    const { query, region, costIndex } = req.query;

    let filtered = CITIES_DATASET;

    if (query) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter(
        (c) =>
          c.city.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q) ||
          c.region.toLowerCase().includes(q)
      );
    }

    if (region) {
      filtered = filtered.filter((c) => c.region.toLowerCase() === region.toLowerCase());
    }

    if (costIndex) {
      filtered = filtered.filter((c) => c.costIndex.toLowerCase() === costIndex.toLowerCase());
    }

    res.status(200).json({
      success: true,
      count: filtered.length,
      cities: filtered,
    });
  } catch (error) {
    console.error('[City Controller Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving cities dataset',
    });
  }
};
