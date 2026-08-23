import Activity from '../models/Activity.js';
import Stop from '../models/Stop.js';
import Trip from '../models/Trip.js';

/**
 * Curated Activity Discovery Dataset
 */
export const ACTIVITIES_CATALOG = [
  // --- TOKYO ---
  {
    id: 'act_tokyo_shibuya',
    name: 'Shibuya Crossing & Harajuku Shopping Walk',
    city: 'Tokyo',
    description: 'Explore the world famous Shibuya scramble crossing, Takeshita street fashion, and boutique shops.',
    category: 'Shopping',
    cost: 25,
    duration: 180,
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'act_tokyo_teamlab',
    name: 'teamLab Planets Immersive Digital Art Museum',
    city: 'Tokyo',
    description: 'Walk through water and body-immersive digital light projections and infinite crystal gardens.',
    category: 'Culture',
    cost: 38,
    duration: 120,
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'act_tokyo_tsukiji',
    name: 'Tsukiji Outer Market Food & Fresh Sushi Tasting',
    city: 'Tokyo',
    description: 'Sample fresh tuna sashimi, tamagoyaki, wagyu skewers, and street seafood delicacies with local guide.',
    category: 'Food',
    cost: 45,
    duration: 150,
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'act_tokyo_asakusa',
    name: 'Senso-ji Temple & Asakusa Traditional Rickshaw Tour',
    city: 'Tokyo',
    description: 'Visit Tokyo oldest Buddhist temple, stroll Nakamise shopping street, and take a traditional rickshaw ride.',
    category: 'Sightseeing',
    cost: 35,
    duration: 120,
    image: 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'act_tokyo_skytree',
    name: 'Tokyo Skytree Tembo Deck & 360 Panorama View',
    city: 'Tokyo',
    description: 'Ascend Japan tallest tower for breathtaking 360-degree views of Tokyo skyline and Mount Fuji.',
    category: 'Sightseeing',
    cost: 22,
    duration: 90,
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'act_tokyo_shinjuku_food',
    name: 'Shinjuku Omoide Yokocho Izakaya & Yakitori Night',
    city: 'Tokyo',
    description: 'Atmospheric nightlife food crawl through lantern-lit alleyways tasting grilled yakitori & craft sake.',
    category: 'Food',
    cost: 50,
    duration: 180,
    image: 'https://images.unsplash.com/photo-1554797589-7241ab691973?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'act_tokyo_fuji_day',
    name: 'Mount Fuji & Lake Kawaguchiko Day Excursion',
    city: 'Tokyo',
    description: 'Full-day scenic trip to Mount Fuji 5th Station, Chureito Pagoda, and Lake Kawaguchiko views.',
    category: 'Nature',
    cost: 85,
    duration: 480,
    image: 'https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'act_tokyo_akihabara',
    name: 'Akihabara Anime, Gaming & Otaku Cultural Walk',
    city: 'Tokyo',
    description: 'Guided tour of retro arcade towers, manga centers, anime figures, and maid cafes in Tokyo Electric Town.',
    category: 'Culture',
    cost: 20,
    duration: 150,
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
  },

  // --- KYOTO ---
  {
    id: 'act_kyoto_bamboo',
    name: 'Arashiyama Bamboo Grove & Monkey Park Walk',
    city: 'Kyoto',
    description: 'Peaceful morning walk through towering green bamboo stalks and Tenryu-ji Temple gardens.',
    category: 'Nature',
    cost: 15,
    duration: 120,
    image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'act_kyoto_tea',
    name: 'Traditional Machiya Kimono Tea Ceremony',
    city: 'Kyoto',
    description: 'Immersive tea ritual in a historic wooden townhouse with authentic Matcha preparation.',
    category: 'Culture',
    cost: 50,
    duration: 90,
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'act_kyoto_fushimi',
    name: 'Fushimi Inari Shrine 10,000 Torii Gates Hike',
    city: 'Kyoto',
    description: 'Hike through sacred vermilion torii gates up Mount Inari with valley overlook views.',
    category: 'Sightseeing',
    cost: 10,
    duration: 180,
    image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?auto=format&fit=crop&w=800&q=80',
  },

  // --- PARIS ---
  {
    id: 'act_eiffel_tour',
    name: 'Eiffel Tower Summit & Garden Tour',
    city: 'Paris',
    description: 'Priority access to Eiffel Tower summit with guided historical narration and champagne toast.',
    category: 'Sightseeing',
    cost: 45,
    duration: 120,
    image: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'act_louvre_guided',
    name: 'Louvre Museum Masterpieces Walk',
    city: 'Paris',
    description: 'Skip-the-line small group tour of Mona Lisa, Venus de Milo, and Winged Victory.',
    category: 'Culture',
    cost: 65,
    duration: 180,
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'act_paris_seine_dinner',
    name: 'Seine River Evening Gourmet Dinner Cruise',
    city: 'Paris',
    description: 'Romantic glass-canopy boat cruise with 3-course French dining along illuminated monuments.',
    category: 'Food',
    cost: 95,
    duration: 150,
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
  },

  // --- SANTORINI & BALI & MUMBAI & GOA ---
  {
    id: 'act_santorini_catamaran',
    name: 'Santorini Caldera Sunset Catamaran Cruise',
    city: 'Santorini',
    description: 'Luxury sailing cruise around Red Beach, White Beach, hot springs, with BBQ lunch & wine.',
    category: 'Adventure',
    cost: 110,
    duration: 300,
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'act_bali_tegallalang',
    name: 'Tegallalang Rice Terrace & Jungle Swing Tour',
    city: 'Bali',
    description: 'Soar over lush emerald rice paddies on a jungle swing and explore traditional irrigation terraces.',
    category: 'Adventure',
    cost: 35,
    duration: 180,
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'act_mumbai_street_food',
    name: 'Juhu Beach & Chowpatty Street Food Crawl',
    city: 'Mumbai',
    description: 'Taste authentic Pav Bhaji, Pani Puri, Bhel Puri, and Vada Pav guided by local culinary experts.',
    category: 'Food',
    cost: 20,
    duration: 150,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'act_goa_scuba',
    name: 'Grande Island Scuba Diving & Snorkeling',
    city: 'Goa',
    description: 'Underwater scuba dive session with underwater photos, training, and PADI instructors.',
    category: 'Adventure',
    cost: 50,
    duration: 300,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'act_goa_baga_beach',
    name: 'Baga & Calangute Beach Sunset & Watersports',
    city: 'Goa',
    description: 'Relax on golden sands, enjoy parasailing, jet skiing, and vibrant beach shack vibes.',
    category: 'Relaxation',
    cost: 15,
    duration: 180,
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'act_goa_tito_nightlife',
    name: 'Tito\'s Lane & Club Cubana Nightlife Crawl',
    city: 'Goa',
    description: 'Experience premier North Goa nightlife, dance floors, rooftop cocktail lounges, and beach parties.',
    category: 'Nightlife',
    cost: 25,
    duration: 240,
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'act_goa_seafood_trail',
    name: 'Authentic Goan Seafood & Portuguese Curry Tasting',
    city: 'Goa',
    description: 'Sample authentic Prawn Balchao, Fish Curry Rice, Poi bread, and Bebinca dessert with local chefs.',
    category: 'Food',
    cost: 20,
    duration: 150,
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'act_goa_old_heritage',
    name: 'Old Goa Latin Quarter (Fontainhas) Heritage Walk',
    city: 'Goa',
    description: 'Stroll through colorful colonial Portuguese villas, historic chapels, and artisan cafes in Panaji.',
    category: 'Culture',
    cost: 10,
    duration: 120,
    image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'act_goa_anjuna_curlies',
    name: 'Anjuna Beach Sunset & Curlies Shack Party',
    city: 'Goa',
    description: 'Watch the Arabian Sea sunset from rocky cliffs accompanied by trance rhythms, craft drinks, and bonfires.',
    category: 'Nightlife',
    cost: 15,
    duration: 180,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  },
];

/**
 * @route   GET /api/activities/catalog
 * @desc    Search and filter curated activity discovery catalog
 * @access  Public / Private
 */
export const getActivityCatalog = async (req, res) => {
  try {
    const { query, city, category, maxCost, maxDuration } = req.query;

    let filtered = ACTIVITIES_CATALOG;

    if (query) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q)
      );
    }

    if (city) {
      const targetCity = city.toLowerCase().trim();
      const firstPart = targetCity.split(',')[0].trim();
      const cityMatches = filtered.filter(
        (a) =>
          targetCity.includes(a.city.toLowerCase()) ||
          a.city.toLowerCase().includes(firstPart)
      );
      if (cityMatches.length > 0) {
        filtered = cityMatches;
      }
    }

    if (category && category !== 'All') {
      filtered = filtered.filter((a) => a.category.toLowerCase() === category.toLowerCase().trim());
    }

    if (maxCost) {
      filtered = filtered.filter((a) => a.cost <= Number(maxCost));
    }

    if (maxDuration) {
      filtered = filtered.filter((a) => a.duration <= Number(maxDuration));
    }

    res.status(200).json({
      success: true,
      count: filtered.length,
      activities: filtered,
    });
  } catch (error) {
    console.error('[Get Activity Catalog Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving activity catalog',
    });
  }
};

const CATEGORY_DEFAULT_IMAGES = {
  Food: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  'Food & Dining': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  Dining: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  Sightseeing: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
  Nature: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
  Culture: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  Cultural: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
  Shopping: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',
  Adventure: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
  Nightlife: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
  Relaxation: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
};

export const getCategoryDefaultImage = (cat) => {
  if (!cat) return CATEGORY_DEFAULT_IMAGES.Sightseeing;
  return CATEGORY_DEFAULT_IMAGES[cat] || CATEGORY_DEFAULT_IMAGES.Sightseeing;
};

/**
 * Helper to verify trip ownership for authenticated user
 */
const checkTripOwnership = async (tripId, userId) => {
  const trip = await Trip.findById(tripId);
  if (!trip) return { error: 'Trip not found', status: 404 };
  if (trip.user.toString() !== userId.toString()) {
    return { error: 'Not authorized to modify activities for this trip', status: 403 };
  }
  return { trip };
};

/**
 * @route   POST /api/trips/:tripId/stops/:stopId/activities
 * @desc    Add an activity to a specific trip stop
 * @access  Private
 */
export const addActivityToStop = async (req, res) => {
  try {
    const { tripId, stopId } = req.params;
    const { name, description, category, date, time, duration, cost, image } = req.body;

    // 1. Ownership check
    const { error, status } = await checkTripOwnership(tripId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    // 2. Stop existence check
    const stop = await Stop.findOne({ _id: stopId, trip: tripId });
    if (!stop) {
      return res.status(404).json({
        success: false,
        message: 'Destination stop not found on this trip',
      });
    }

    // 3. Validation
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Activity name is required',
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Activity date is required',
      });
    }

    const activityDate = new Date(date);
    if (isNaN(activityDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid activity date format',
      });
    }

    const cat = category || 'Sightseeing';
    const finalImage = image && image.trim() ? image.trim() : getCategoryDefaultImage(cat);

    // 4. Create Activity
    const activity = await Activity.create({
      trip: tripId,
      stop: stopId,
      name: name.trim(),
      description: description ? description.trim() : '',
      category: cat,
      date: activityDate,
      time: time || '09:00',
      duration: Number(duration) || 60,
      cost: Number(cost) || 0,
      image: finalImage,
    });

    res.status(201).json({
      success: true,
      message: 'Activity added to stop successfully',
      activity,
    });
  } catch (error) {
    console.error('[Add Activity Error]:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error adding activity',
    });
  }
};

/**
 * @route   GET /api/trips/:tripId/activities
 * @desc    Get all activities assigned to a trip
 * @access  Private
 */
export const getActivitiesByTrip = async (req, res) => {
  try {
    const { tripId } = req.params;

    const { error, status } = await checkTripOwnership(tripId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const activities = await Activity.find({ trip: tripId }).sort({ date: 1, time: 1 });

    res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error('[Get Activities Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving trip activities',
    });
  }
};

/**
 * @route   DELETE /api/trips/:tripId/activities/:activityId
 * @desc    Remove an activity from a trip
 * @access  Private
 */
export const deleteActivity = async (req, res) => {
  try {
    const { tripId, activityId } = req.params;

    const { error, status } = await checkTripOwnership(tripId, req.user._id);
    if (error) return res.status(status).json({ success: false, message: error });

    const activity = await Activity.findOne({ _id: activityId, trip: tripId });
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found',
      });
    }

    await activity.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Activity removed successfully',
      deletedId: activityId,
    });
  } catch (error) {
    console.error('[Delete Activity Error]:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error removing activity',
    });
  }
};
