/**
 * Simulated Demo Hotels Dataset
 * 
 * IMPORTANT:
 * This is fictional DEMO hotel inventory for hackathon and simulation purposes.
 * It is NOT connected to any real hotel booking provider or property management system.
 * All prices, availability, and ratings are deterministic demo representations.
 */

export const DEMO_HOTELS = [
  // =========================================================================
  // 1. GOA
  // =========================================================================
  {
    id: 'demo_htl_goa_01',
    name: 'Candolim Sunset Palm Resort',
    city: 'Goa',
    area: 'North Goa (Candolim)',
    pricePerNight: 2800,
    rating: 4.5,
    roomsAvailable: 7,
    amenities: ['Swimming Pool', 'Free Wi-Fi', 'Complimentary Breakfast', 'Beach Shuttle (300m)'],
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },
  {
    id: 'demo_htl_goa_02',
    name: 'Zostel Backpacker Social Hostel & Suites',
    city: 'Goa',
    area: 'North Goa (Morjim)',
    pricePerNight: 1200,
    rating: 4.4,
    roomsAvailable: 14,
    amenities: ['AC Private Rooms', 'Rooftop Cafe', 'Community Bonfire Nights', 'Free Wi-Fi'],
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },
  {
    id: 'demo_htl_goa_03',
    name: 'Taj Aguada Heritage Grand Resort & Spa',
    city: 'Goa',
    area: 'North Goa (Sinquerim)',
    pricePerNight: 8500,
    rating: 4.9,
    roomsAvailable: 4,
    amenities: ['Private Beachfront', 'Infinity Pool', 'Luxury Ayurvedic Spa', 'Multi-Cuisine Fine Dining'],
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },
  {
    id: 'demo_htl_goa_04',
    name: 'Anjuna Coastal Breeze Guesthouse',
    city: 'Goa',
    area: 'North Goa (Anjuna)',
    pricePerNight: 950,
    rating: 4.1,
    roomsAvailable: 9,
    amenities: ['Balcony View', 'Scooter Rental Desk', 'Air Conditioning', 'Free Parking'],
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },
  {
    id: 'demo_htl_goa_05',
    name: 'Palolem Eco Lagoon Cottage Retreat',
    city: 'Goa',
    area: 'South Goa (Palolem)',
    pricePerNight: 2100,
    rating: 4.6,
    roomsAvailable: 6,
    amenities: ['Wooden Beach Cottages', 'Yoga Deck', 'Garden Dining', 'Kayak Rentals'],
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },

  // =========================================================================
  // 2. MUMBAI
  // =========================================================================
  {
    id: 'demo_htl_mum_01',
    name: 'The Marine Plaza Heritage Bay',
    city: 'Mumbai',
    area: 'South Mumbai (Marine Drive)',
    pricePerNight: 6200,
    rating: 4.7,
    roomsAvailable: 5,
    amenities: ['Sea Facing Rooms', 'Rooftop Pool', 'Executive Lounge', 'Fitness Center'],
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },
  {
    id: 'demo_htl_mum_02',
    name: 'Bandra Art Residency Suites',
    city: 'Mumbai',
    area: 'Western Suburbs (Bandra West)',
    pricePerNight: 3100,
    rating: 4.4,
    roomsAvailable: 8,
    amenities: ['Kitchenette', 'Free High-Speed Wi-Fi', 'Cafe & Bakery', 'Concierge'],
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },
  {
    id: 'demo_htl_mum_03',
    name: 'FabHotel Colaba Central',
    city: 'Mumbai',
    area: 'South Mumbai (Colaba)',
    pricePerNight: 1650,
    rating: 4.0,
    roomsAvailable: 12,
    amenities: ['Air Conditioning', 'Free Breakfast', '24h Front Desk', 'Close to Gateway of India'],
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },

  // =========================================================================
  // 3. JAIPUR
  // =========================================================================
  {
    id: 'demo_htl_jai_01',
    name: 'Shahpura Haveli Heritage Palace',
    city: 'Jaipur',
    area: 'Old City (Bani Park)',
    pricePerNight: 3600,
    rating: 4.8,
    roomsAvailable: 6,
    amenities: ['Traditional Rajasthani Architecture', 'Courtyard Pool', 'Folk Music Evenings', 'Breakfast Included'],
    image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },
  {
    id: 'demo_htl_jai_02',
    name: 'Pink City Royal Boutique Hotel',
    city: 'Jaipur',
    area: 'C-Scheme (Central Jaipur)',
    pricePerNight: 2200,
    rating: 4.3,
    roomsAvailable: 11,
    amenities: ['Rooftop Restaurant', 'Free Wi-Fi', 'City Fort Tours', 'AC Deluxe Rooms'],
    image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },
  {
    id: 'demo_htl_jai_03',
    name: 'Zostel Jaipur Backpacker Hub',
    city: 'Jaipur',
    area: 'Hawa Mahal Enclave',
    pricePerNight: 850,
    rating: 4.5,
    roomsAvailable: 15,
    amenities: ['Private Ensuite Rooms', 'Common Game Room', 'Terrace View of Old City', 'Walking Tours'],
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },

  // =========================================================================
  // 4. PARIS
  // =========================================================================
  {
    id: 'demo_htl_par_01',
    name: 'Hotel Eiffel Seine Panorama',
    city: 'Paris',
    area: '7th Arrondissement (Tour Eiffel)',
    pricePerNight: 12500,
    rating: 4.8,
    roomsAvailable: 4,
    amenities: ['Eiffel Tower Balcony View', 'French Continental Breakfast', 'Concierge Service', 'Boutique Bar'],
    image: 'https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },
  {
    id: 'demo_htl_par_02',
    name: 'Montmartre Bohemian Boutique Inn',
    city: 'Paris',
    area: '18th Arrondissement (Montmartre)',
    pricePerNight: 6800,
    rating: 4.4,
    roomsAvailable: 7,
    amenities: ['Historic Cobblestone View', 'Free Wi-Fi', 'Artisan Coffee Bar', 'Metro Access (200m)'],
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },
  {
    id: 'demo_htl_par_03',
    name: 'Generator Paris Canal Hostel & Rooms',
    city: 'Paris',
    area: '10th Arrondissement (Canal Saint-Martin)',
    pricePerNight: 3200,
    rating: 4.2,
    roomsAvailable: 18,
    amenities: ['Rooftop View of Sacre-Coeur', 'Ensuite Double Rooms', 'Underground Lounge', '24h Front Desk'],
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },

  // =========================================================================
  // 5. BALI
  // =========================================================================
  {
    id: 'demo_htl_bal_01',
    name: 'Ubud Jungle Sanctuary Villas & Spa',
    city: 'Bali',
    area: 'Ubud (Ayung River)',
    pricePerNight: 4500,
    rating: 4.9,
    roomsAvailable: 5,
    amenities: ['Private Plunge Pool', 'Rainforest View', 'Floating Breakfast', 'Daily Morning Yoga'],
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },
  {
    id: 'demo_htl_bal_02',
    name: 'Seminyak Sands Beach Club Hotel',
    city: 'Bali',
    area: 'Seminyak (Petitenget Beach)',
    pricePerNight: 2900,
    rating: 4.6,
    roomsAvailable: 10,
    amenities: ['Lagoon Pool', 'Sunset Cocktails', 'Direct Beach Walkway', 'Spa Treatments'],
    image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },
  {
    id: 'demo_htl_bal_03',
    name: 'Canggu Surf Shack & Eco Pods',
    city: 'Bali',
    area: 'Canggu (Batu Bolong)',
    pricePerNight: 1100,
    rating: 4.3,
    roomsAvailable: 16,
    amenities: ['Surfboard Racks', 'Co-Working Lounge', 'Shared Kitchen & Pool', 'Healthy Vegan Cafe'],
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },

  // =========================================================================
  // 6. TOKYO
  // =========================================================================
  {
    id: 'demo_htl_tok_01',
    name: 'Shinjuku Skyscraper Panorama Hotel',
    city: 'Tokyo',
    area: 'Shinjuku Central',
    pricePerNight: 9800,
    rating: 4.8,
    roomsAvailable: 6,
    amenities: ['Mount Fuji Horizon View', 'Onsen Hot Spring Bath', 'Airport Limousine Bus Stop', 'High-Speed Wi-Fi'],
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },
  {
    id: 'demo_htl_tok_02',
    name: 'Asakusa Kaminarimon Traditional Ryokan',
    city: 'Tokyo',
    area: 'Taito-ku (Asakusa)',
    pricePerNight: 5400,
    rating: 4.7,
    roomsAvailable: 5,
    amenities: ['Tatami Rooms', 'Yukata Robes Provided', 'Traditional Japanese Breakfast', 'Near Senso-ji'],
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },
  {
    id: 'demo_htl_tok_03',
    name: 'Akihabara Urban Capsule Pods & Private Cubes',
    city: 'Tokyo',
    area: 'Chiyoda (Akihabara)',
    pricePerNight: 2400,
    rating: 4.3,
    roomsAvailable: 20,
    amenities: ['Futuristic Pod Beds', 'Sauna Facilities', 'High-Speed Fiber Net', '24h Luggage Lockers'],
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },

  // =========================================================================
  // 7. KYOTO
  // =========================================================================
  {
    id: 'demo_htl_kyo_01',
    name: 'Gion Machiya Historic Garden Inn',
    city: 'Kyoto',
    area: 'Higashiyama (Gion)',
    pricePerNight: 8200,
    rating: 4.9,
    roomsAvailable: 4,
    amenities: ['Zen Bamboo Garden', 'Hinoki Cypress Wood Bath', 'Matcha Welcome Ceremony', 'Geisha District Walk'],
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },
  {
    id: 'demo_htl_kyo_02',
    name: 'Kyoto Station Grand Terrace Hotel',
    city: 'Kyoto',
    area: 'Shimogyo Ward (Kyoto Station)',
    pricePerNight: 4100,
    rating: 4.5,
    roomsAvailable: 9,
    amenities: ['Shinkansen Station Access (3min)', 'Western & Japanese Buffet', 'Coin Laundromat', 'Quiet Rooms'],
    image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },
  {
    id: 'demo_htl_kyo_03',
    name: 'Kamo River Backpacker Social Guesthouse',
    city: 'Kyoto',
    area: 'Nakagyo Ward (Sanjo)',
    pricePerNight: 1900,
    rating: 4.4,
    roomsAvailable: 12,
    amenities: ['Riverside View Terrace', 'Free Bicycle Rentals', 'Communal Kitchen', 'Japanese Tea Bar'],
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    isDemo: true,
  },
];

export default DEMO_HOTELS;
