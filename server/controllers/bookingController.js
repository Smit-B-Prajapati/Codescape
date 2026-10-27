import Booking from '../models/Booking.js';
import Trip from '../models/Trip.js';
import Stop from '../models/Stop.js';
import Payment from '../models/Payment.js';
import { DEMO_TRAINS } from '../data/trains.js';
import { DEMO_HOTELS } from '../data/hotels.js';
import { calculateNights } from '../services/hotelService.js';
import PDFDocument from 'pdfkit';

/**
 * Generates an explicitly simulated unique booking reference string.
 * Example: DEMO-BK-4K9Z-L8M2N1
 * 
 * @returns {string} Unique demo reference
 */
const generateBookingReference = () => {
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timestampChars = Date.now().toString(36).toUpperCase();
  return `DEMO-BK-${randomChars}-${timestampChars}`;
};

const MULTIMODAL_FLIGHTS = [
  { id: 'tr_fl_01', carrier: 'IndiGo Express 6E-402', trainNumber: '6E-402', name: 'IndiGo Express 6E-402', from: 'Vadodara (BDQ)', to: 'Goa (GOI)', departure: '08:45 AM', arrival: '11:15 AM', duration: '2h 30m', class: 'Economy', price: 4800, transportType: 'flight', isDemo: true },
  { id: 'tr_fl_02', carrier: 'Air India AI-812', trainNumber: 'AI-812', name: 'Air India AI-812', from: 'Vadodara (BDQ)', to: 'Goa (GOI)', departure: '02:15 PM', arrival: '05:00 PM', duration: '2h 45m', class: 'Economy', price: 5200, transportType: 'flight', isDemo: true },
  { id: 'tr_bus_01', carrier: 'VRL Premium Multi-Axle AC Sleeper', trainNumber: 'VRL-108', name: 'VRL Premium Multi-Axle AC Sleeper', from: 'Vadodara', to: 'Goa', departure: '07:00 PM', arrival: '10:30 AM', duration: '15h 30m', class: 'AC Sleeper', price: 1100, transportType: 'bus', isDemo: true },
  { id: 'tr_fl_sws_01', carrier: 'Swiss International Air Lines LX-155', trainNumber: 'LX-155', name: 'Swiss International Air Lines LX-155', from: 'Mumbai (BOM)', to: 'Switzerland (Zurich ZRH)', departure: '01:45 AM', arrival: '06:15 AM', duration: '8h 30m', class: 'International', price: 38000, transportType: 'flight', isDemo: true },
  { id: 'tr_fl_sws_02', carrier: 'Emirates Express EK-501 (via Dubai)', trainNumber: 'EK-501', name: 'Emirates Express EK-501', from: 'Mumbai (BOM)', to: 'Switzerland (Geneva GVA)', departure: '04:30 AM', arrival: '01:15 PM', duration: '11h 45m', class: 'Standard', price: 32000, transportType: 'flight', isDemo: true },
  { id: 'tr_fl_sws_03', carrier: 'Air India AI-143 (Dreamliner)', trainNumber: 'AI-143', name: 'Air India AI-143', from: 'Delhi (DEL)', to: 'Switzerland (Zurich ZRH)', departure: '08:30 AM', arrival: '06:00 PM', duration: '12h 30m', class: 'Economy', price: 26000, transportType: 'flight', isDemo: true },
  { id: 'tr_fl_ksh_01', carrier: 'IndiGo Express 6E-214', trainNumber: '6E-214', name: 'IndiGo Express 6E-214', from: 'Delhi (DEL) / Mumbai (BOM)', to: 'Kashmir (Srinagar SXR)', departure: '09:15 AM', arrival: '11:45 AM', duration: '2h 30m', class: 'Economy', price: 4200, transportType: 'flight', isDemo: true },
  { id: 'tr_fl_ksh_02', carrier: 'Air India AI-825', trainNumber: 'AI-825', name: 'Air India AI-825', from: 'Delhi (DEL)', to: 'Kashmir (Srinagar SXR)', departure: '01:30 PM', arrival: '04:00 PM', duration: '2h 30m', class: 'Executive', price: 5400, transportType: 'flight', isDemo: true },
  { id: 'tr_fl_ksh_03', carrier: 'SpiceJet SG-1025', trainNumber: 'SG-1025', name: 'SpiceJet SG-1025', from: 'Delhi (DEL)', to: 'Kashmir (Srinagar SXR)', departure: '06:45 AM', arrival: '09:15 AM', duration: '2h 30m', class: 'Economy', price: 3600, transportType: 'flight', isDemo: true },
  { id: 'tr_fl_prs_01', carrier: 'Air France AF-217', trainNumber: 'AF-217', name: 'Air France AF-217', from: 'Mumbai (BOM)', to: 'Paris (CDG)', departure: '02:15 AM', arrival: '08:00 AM', duration: '9h 15m', class: 'Economy', price: 42000, transportType: 'flight', isDemo: true },
  { id: 'tr_fl_prs_02', carrier: 'Emirates EK-073', trainNumber: 'EK-073', name: 'Emirates EK-073', from: 'Delhi (DEL)', to: 'Paris (CDG)', departure: '04:30 AM', arrival: '01:30 PM', duration: '12h 30m', class: 'Standard', price: 34000, transportType: 'flight', isDemo: true },
  { id: 'tr_fl_tky_01', carrier: 'ANA All Nippon Airways NH-830', trainNumber: 'NH-830', name: 'ANA NH-830', from: 'Mumbai (BOM)', to: 'Tokyo (NRT)', departure: '08:20 PM', arrival: '07:10 AM', duration: '8h 30m', class: 'Economy', price: 46000, transportType: 'flight', isDemo: true },
  { id: 'tr_fl_bli_01', carrier: 'Garuda Indonesia GA-870', trainNumber: 'GA-870', name: 'Garuda Indonesia GA-870', from: 'Mumbai (BOM)', to: 'Bali (DPS)', departure: '01:30 AM', arrival: '09:45 AM', duration: '6h 15m', class: 'Economy', price: 22000, transportType: 'flight', isDemo: true },
];

function findDemoTransport(targetOptionId, trip = {}) {
  if (!targetOptionId) return null;
  const matchTrain = DEMO_TRAINS.find((t) => t.id === targetOptionId || t.trainNumber === targetOptionId);
  if (matchTrain) {
    return {
      ...matchTrain,
      transportType: 'train',
      carrier: `${matchTrain.name} (${matchTrain.trainNumber} - ${matchTrain.class})`,
    };
  }
  const matchMulti = MULTIMODAL_FLIGHTS.find((f) => f.id === targetOptionId || f.trainNumber === targetOptionId);
  if (matchMulti) return matchMulti;

  const destName = trip.destination || 'Destination';
  return {
    id: targetOptionId,
    trainNumber: 'EXP-101',
    name: `${destName} Express Service`,
    carrier: `${destName} Express Service (3A)`,
    from: trip.origin || 'Origin Hub',
    to: destName,
    fromCity: trip.origin || 'Origin',
    toCity: destName,
    departure: '07:00 AM',
    arrival: '03:30 PM',
    duration: '8h 30m',
    class: '3A',
    price: 1250,
    transportType: 'train',
    isDemo: true,
  };
}

function findDemoHotel(targetOptionId, trip = {}) {
  if (!targetOptionId) return null;
  const matchHotel = DEMO_HOTELS.find((h) => h.id === targetOptionId);
  if (matchHotel) return matchHotel;

  const destName = trip.destination || 'Destination';
  return {
    id: targetOptionId,
    name: `Grand ${destName} Palace & Suites`,
    city: destName,
    area: 'City Center',
    pricePerNight: 2800,
    rating: 4.6,
    amenities: ['Free WiFi', 'AC', 'Breakfast Included', 'Swimming Pool'],
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    isDemo: true,
  };
}


/**
 * @route   POST /api/bookings/prepare
 * @desc    Prepare a pending demo booking without confirming it
 * @access  Private (Requires JWT)
 */
export const prepareBooking = async (req, res) => {
  try {
    const { tripId, type, optionId, transportOptionId, hotelOptionId } = req.body;

    // 1. Authentication check
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to prepare a booking',
      });
    }

    // 2. Validate input parameters
    if (!tripId) {
      return res.status(400).json({
        success: false,
        message: 'Trip ID (tripId) is required to prepare a booking',
      });
    }

    const normalizedType = (type || '').toLowerCase().trim();
    if (!['transport', 'hotel', 'package'].includes(normalizedType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking type. Must be "transport", "hotel", or "package"',
      });
    }

    // 3. Verify that the trip exists
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found',
      });
    }

    // 4. Verify that the authenticated user owns the trip
    if (trip.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to book for this trip',
      });
    }

    // Calculate traveler count from trip
    const travelerCount = (trip.travelers && trip.travelers.length > 0)
      ? trip.travelers.length
      : (Number(req.body.travelers) > 0 ? Number(req.body.travelers) : 1);

    let provider = '';
    let referenceId = '';
    let calculatedAmount = 0;
    let details = {};

    // 5. Validate the selected option against trusted backend data and calculate amount
    if (normalizedType === 'transport') {
      const targetOptionId = optionId || transportOptionId;
      if (!targetOptionId) {
        return res.status(400).json({
          success: false,
          message: 'An optionId is required for transport booking',
        });
      }

      const transport = findDemoTransport(targetOptionId, trip);

      if (!transport) {
        return res.status(404).json({
          success: false,
          message: 'Invalid transport option. Selected transport was not found in trusted inventory.',
        });
      }

      calculatedAmount = Number(transport.price) * travelerCount;
      provider = transport.transportType === 'flight' ? 'Demo Airlines Simulation' : 'Indian Railways (Demo Simulation)';
      referenceId = transport.id;

      details = {
        transportType: transport.transportType || 'train',
        trainNumber: transport.trainNumber,
        name: transport.name || transport.carrier,
        carrier: transport.carrier || transport.name,
        from: transport.from,
        to: transport.to,
        fromCity: transport.fromCity || transport.from,
        toCity: transport.toCity || transport.to,
        departure: transport.departure,
        arrival: transport.arrival,
        duration: transport.duration,
        class: transport.class,
        pricePerPerson: Number(transport.price),
        travelers: travelerCount,
        travelersList: trip.travelers || [],
        totalPrice: calculatedAmount,
        departureDate: trip.startDate,
        arrivalDate: trip.endDate,
        isDemo: true,
      };
    } else if (normalizedType === 'hotel') {
      const targetOptionId = optionId || hotelOptionId;
      if (!targetOptionId) {
        return res.status(400).json({
          success: false,
          message: 'An optionId is required for hotel booking',
        });
      }

      const hotel = findDemoHotel(targetOptionId, trip);

      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: 'Invalid hotel option. Selected hotel was not found in trusted inventory.',
        });
      }

      const nights = calculateNights(trip.startDate, trip.endDate);
      calculatedAmount = Number(hotel.pricePerNight) * nights;
      provider = 'Demo Hotel Inventory';
      referenceId = hotel.id;

      details = {
        hotelId: hotel.id,
        name: hotel.name,
        city: hotel.city,
        area: hotel.area,
        pricePerNight: Number(hotel.pricePerNight),
        rating: hotel.rating,
        amenities: hotel.amenities || [],
        image: hotel.image || '',
        checkIn: trip.startDate,
        checkOut: trip.endDate,
        nights,
        totalPrice: calculatedAmount,
        isDemo: true,
      };
    } else if (normalizedType === 'package') {
      const targetTrainId = transportOptionId || optionId;
      const targetHotelId = hotelOptionId;

      if (!targetTrainId || !targetHotelId) {
        return res.status(400).json({
          success: false,
          message: 'Both transportOptionId and hotelOptionId are required for a package booking',
        });
      }

      const transport = findDemoTransport(targetTrainId, trip);
      const hotel = findDemoHotel(targetHotelId, trip);

      if (!transport || !hotel) {
        return res.status(404).json({
          success: false,
          message: 'One or more package items were not found in trusted demo inventory.',
        });
      }

      const nights = calculateNights(trip.startDate, trip.endDate);
      const transportTotal = Number(transport.price) * travelerCount;
      const hotelTotal = Number(hotel.pricePerNight) * nights;
      calculatedAmount = transportTotal + hotelTotal;

      provider = 'GlobeThrottle Complete Travel Package (Hotel + Transport)';
      referenceId = `${transport.id}_${hotel.id}`;

      details = {
        isPackage: true,
        transport: {
          transportType: transport.transportType || 'train',
          trainNumber: transport.trainNumber,
          name: transport.name || transport.carrier,
          carrier: transport.carrier || transport.name,
          from: transport.from,
          to: transport.to,
          departure: transport.departure,
          arrival: transport.arrival,
          duration: transport.duration,
          class: transport.class,
          pricePerPerson: Number(transport.price),
          travelers: travelerCount,
          totalPrice: transportTotal,
          departureDate: trip.startDate,
          arrivalDate: trip.endDate,
          isDemo: true,
        },
        hotel: {
          hotelId: hotel.id,
          name: hotel.name,
          city: hotel.city,
          area: hotel.area,
          pricePerNight: Number(hotel.pricePerNight),
          rating: hotel.rating,
          nights,
          checkIn: trip.startDate,
          checkOut: trip.endDate,
          totalPrice: hotelTotal,
          isDemo: true,
        },
        transportCost: transportTotal,
        accommodationCost: hotelTotal,
        totalPrice: calculatedAmount,
        isDemo: true,
      };
    }

    // 6. Prevent duplicate booking preparation where appropriate (within 15 minutes window)
    const existingPending = await Booking.findOne({
      user: req.user._id,
      trip: trip._id,
      type: normalizedType,
      referenceId,
      status: 'pending',
      createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
    });

    if (existingPending) {
      return res.status(200).json({
        success: true,
        isExisting: true,
        booking: {
          bookingId: existingPending._id,
          bookingReference: existingPending.bookingReference,
          status: existingPending.status,
          isDemo: existingPending.isDemo,
          amount: existingPending.amount,
          currency: existingPending.currency,
          details: existingPending.details,
        },
      });
    }

    // 7. Create a pending demo booking with backend-generated reference
    const bookingReference = generateBookingReference();

    const booking = await Booking.create({
      user: req.user._id,
      trip: trip._id,
      type: normalizedType,
      provider,
      referenceId,
      details,
      amount: calculatedAmount,
      currency: trip.currency || 'INR',
      status: 'pending',
      isDemo: true,
      bookingReference,
    });

    // 8. Return response format adhering to specification
    return res.status(201).json({
      success: true,
      booking: {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        status: booking.status,
        isDemo: booking.isDemo,
        amount: booking.amount,
        currency: booking.currency,
        details: booking.details,
      },
    });
  } catch (error) {
    console.error('[Booking Prepare Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error preparing demo booking',
    });
  }
};

/**
 * @route   GET /api/bookings/:bookingId
 * @desc    Fetch authenticated booking details for review page
 * @access  Private (Requires JWT)
 */
export const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to view booking details',
      });
    }

    // Query booking by MongoDB _id or unique bookingReference
    const idStr = String(bookingId || '');
    const query = idStr.startsWith('DEMO-BK-')
      ? { bookingReference: idStr }
      : { _id: bookingId };

    const booking = await Booking.findOne(query);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Verify authenticated user owns the booking
    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access this booking',
      });
    }

    // Fetch related Trip information
    const trip = await Trip.findById(booking.trip);
    let destination = 'Destination';

    if (trip) {
      const stops = await Stop.find({ trip: trip._id }).sort({ order: 1 });
      if (stops && stops.length > 0) {
        destination = stops.map((s) => s.city).join(' → ');
      } else {
        destination = trip.name;
      }
    }

    // Find any related bookings for this trip
    const relatedBookings = await Booking.find({
      trip: booking.trip,
      user: req.user._id,
      _id: { $ne: booking._id },
    }).lean();

    return res.status(200).json({
      success: true,
      booking: {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        type: booking.type,
        provider: booking.provider,
        referenceId: booking.referenceId,
        status: booking.status,
        isDemo: booking.isDemo,
        amount: booking.amount,
        currency: booking.currency,
        details: booking.details,
        createdAt: booking.createdAt,
        trip: trip
          ? {
              _id: trip._id,
              name: trip.name,
              destination,
              startDate: trip.startDate,
              endDate: trip.endDate,
              travelers: trip.travelers || [],
              travelerCount: trip.travelers?.length || 1,
              budgetLimit: trip.budgetLimit,
              currency: trip.currency,
            }
          : null,
        relatedBookings: relatedBookings || [],
      },
    });
  } catch (error) {
    console.error('[Get Booking Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving booking details',
    });
  }
};

/**
 * @route   POST /api/bookings/:bookingId/confirm
 * @desc    Confirm booking only upon verification of successful test payment
 * @access  Private (Requires JWT)
 */
export const confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { testPaymentToken, paymentStatus } = req.body;

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to confirm booking',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to confirm this booking',
      });
    }

    // Enforce test payment requirement: do NOT allow a booking to become confirmed before successful test payment
    if (!testPaymentToken || paymentStatus !== 'completed') {
      return res.status(402).json({
        success: false,
        message: 'Payment verification failed: Cannot confirm demo booking before successful test payment completion',
      });
    }

    // Finalize demo booking confirmation
    booking.status = 'confirmed';
    booking.details = {
      ...(booking.details || {}),
      testPayment: {
        token: testPaymentToken,
        confirmedAt: new Date(),
        isSimulated: true,
      },
    };

    await booking.save();

    return res.status(200).json({
      success: true,
      message: 'Demo booking confirmed successfully',
      booking: {
        bookingId: booking._id,
        bookingReference: booking.bookingReference,
        status: booking.status,
        isDemo: booking.isDemo,
        amount: booking.amount,
        currency: booking.currency,
        details: booking.details,
      },
    });
  } catch (error) {
    console.error('[Confirm Booking Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error confirming booking',
    });
  }
};

/**
 * @route   GET /api/bookings
 * @desc    Get all demo bookings for the authenticated user
 * @access  Private (Requires JWT)
 */
export const getUserBookings = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const bookings = await Booking.find({ user: req.user._id })
      .populate('trip', 'name startDate endDate currency budgetLimit')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error('[Get User Bookings Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving user bookings',
    });
  }
};

/**
 * @route   GET /api/bookings/:bookingId/confirmation.pdf
 * @desc    Generate and download demo booking confirmation PDF
 * @access  Private (Requires JWT)
 */
export const generateBookingConfirmationPdf = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to download confirmation PDF',
      });
    }

    const idStr = String(bookingId || '');
    const query = idStr.startsWith('DEMO-BK-') || idStr.startsWith('GT-DEMO-')
      ? { bookingReference: idStr }
      : { _id: bookingId };

    const booking = await Booking.findOne(query);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to download this confirmation',
      });
    }

    // Fetch associated Trip
    const trip = await Trip.findById(booking.trip);
    const stops = trip ? await Stop.find({ trip: trip._id }).sort({ order: 1 }) : [];    const destination = stops.length > 0 ? stops.map((s) => s.city).join(' - ') : (trip ? trip.name : 'Destination');

    // Fetch Payment
    const payment = await Payment.findOne({ booking: booking._id, status: 'success' }).sort({ createdAt: -1 });
    const txnId = payment?.transactionId || booking.details?.payment?.transactionId || 'TEST-TXN-SIMULATED';

    // Set PDF response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="GlobeTrotter-Confirmation-${booking.bookingReference}.pdf"`
    );

    const formatCurr = (amt, curr = 'INR') => {
      const code = (curr || 'INR').toUpperCase();
      const formatted = Number(amt || 0).toLocaleString('en-IN');
      return `${code} ${formatted}`;
    };

    const formatDateText = (d) => {
      if (!d) return '—';
      try {
        const dt = new Date(d);
        if (isNaN(dt.getTime())) return String(d);
        return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch {
        return String(d);
      }
    };

    const doc = new PDFDocument({
      margins: { top: 32, bottom: 20, left: 36, right: 36 },
      size: 'A4',
      bufferPages: true,
    });
    doc.pipe(res);

    const pageWidth = 595.28;
    const margin = 36;
    const contentWidth = pageWidth - margin * 2; // 523.28

    // Header top accent line
    doc
      .rect(margin, 28, contentWidth, 3)
      .fill('#2563eb');

    // Brand title & Subtitle
    doc
      .fillColor('#1e40af')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('GlobeTrotter', margin, 38, { width: 260 });

    doc
      .fillColor('#64748b')
      .fontSize(8.5)
      .font('Helvetica')
      .text('AUTONOMOUS AI TRAVEL PLATFORM  |  E-TICKET & VOUCHER', margin, 64, { width: 320 });

    // Right side status pill & reference
    const statusBadgeWidth = 152;
    const statusBadgeX = margin + contentWidth - statusBadgeWidth;
    doc
      .roundedRect(statusBadgeX, 36, statusBadgeWidth, 22, 11)
      .fillAndStroke('#ecfdf5', '#10b981');

    doc
      .fillColor('#047857')
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .text('CONFIRMED (TEST MODE)', statusBadgeX, 42, { width: statusBadgeWidth, align: 'center' });

    doc
      .fillColor('#64748b')
      .fontSize(8)
      .font('Helvetica')
      .text(`Issued: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, statusBadgeX, 64, { width: statusBadgeWidth, align: 'right' });

    // Subtle divider
    doc
      .strokeColor('#e2e8f0')
      .lineWidth(0.75)
      .moveTo(margin, 78)
      .lineTo(margin + contentWidth, 78)
      .stroke();

    // 1. KEY TRIP OVERVIEW CARD (Proportional Columns)
    const overviewY = 86;
    const overviewHeight = 46;
    doc
      .roundedRect(margin, overviewY, contentWidth, overviewHeight, 4)
      .fillAndStroke('#f8fafc', '#e2e8f0');

    // Column widths: 155pt, 125pt, 140pt, 90pt
    const c1 = margin + 12;
    const c2 = c1 + 160;
    const c3 = c2 + 130;
    const c4 = c3 + 135;

    // Col 1: Booking Ref
    doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold').text('BOOKING REFERENCE', c1, overviewY + 8, { width: 150 });
    doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text(booking.bookingReference, c1, overviewY + 20, { width: 150 });

    // Col 2: Destination
    doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold').text('DESTINATION', c2, overviewY + 8, { width: 120 });
    doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text(trip?.name || destination, c2, overviewY + 20, { width: 120 });

    // Col 3: Dates
    doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold').text('TRAVEL DATES', c3, overviewY + 8, { width: 130 });
    const datesStr = trip ? `${formatDateText(trip.startDate)} - ${formatDateText(trip.endDate)}` : 'Scheduled';
    doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica').text(datesStr, c3, overviewY + 20, { width: 130 });

    // Col 4: Party
    doc.fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold').text('TRAVELERS', c4, overviewY + 8, { width: 80 });
    const travelersNum = trip?.travelers?.length || booking.details?.travelers || 1;
    doc.fillColor('#0f172a').fontSize(8.5).font('Helvetica-Bold').text(`${travelersNum} Traveler(s)`, c4, overviewY + 20, { width: 80 });

    let currentY = overviewY + overviewHeight + 14;

    // Helper: section header
    const drawSectionHeader = (yPos, titleText, tagText = '') => {
      doc.rect(margin, yPos, 3, 14).fill('#2563eb');
      doc
        .fillColor('#0f172a')
        .fontSize(10.5)
        .font('Helvetica-Bold')
        .text(titleText, margin + 8, yPos + 1, { width: 300 });

      if (tagText) {
        const tagW = 90;
        const tagX = margin + contentWidth - tagW;
        doc
          .roundedRect(tagX, yPos, tagW, 14, 3)
          .fillAndStroke('#eff6ff', '#bfdbfe');
        doc
          .fillColor('#1d4ed8')
          .fontSize(7.5)
          .font('Helvetica-Bold')
          .text(tagText, tagX, yPos + 2.5, { width: tagW, align: 'center' });
      }

      doc
        .strokeColor('#f1f5f9')
        .lineWidth(0.5)
        .moveTo(margin, yPos + 18)
        .lineTo(margin + contentWidth, yPos + 18)
        .stroke();

      return yPos + 22;
    };

    // 2. SECTION: TRANSPORT RESERVATION (IF APPLICABLE)
    const transport = booking.details?.transport || (booking.type === 'transport' ? booking.details : null);
    if (transport) {
      const isFlight = (transport.transportType || '').toLowerCase() === 'flight';
      const transitBadge = isFlight ? 'FLIGHT TRANSIT' : 'TRAIN TRANSIT';
      currentY = drawSectionHeader(currentY, 'TRANSPORTATION RESERVATION', transitBadge);

      const transBoxY = currentY;
      const transBoxHeight = 84;
      doc
        .roundedRect(margin, transBoxY, contentWidth, transBoxHeight, 4)
        .fillAndStroke('#ffffff', '#e2e8f0');

      // Left column: Transport service info
      const leftX = margin + 14;
      doc
        .fillColor('#0f172a')
        .fontSize(10.5)
        .font('Helvetica-Bold')
        .text(`${transport.name || transport.carrier || (isFlight ? 'Flight' : 'Train')}`, leftX, transBoxY + 10, { width: 340 });

      const numberLabel = isFlight ? 'Flight #:' : 'Service / Train #:';
      const numberVal = transport.flightNumber || transport.trainNumber || 'N/A';
      doc
        .fillColor('#475569')
        .fontSize(8.5)
        .font('Helvetica')
        .text(`${numberLabel} ${numberVal}    |    Class: ${transport.class || 'Standard'}`, leftX, transBoxY + 24, { width: 340 });

      // Route & timing with clear separator
      doc
        .strokeColor('#f1f5f9')
        .lineWidth(0.5)
        .moveTo(leftX, transBoxY + 38)
        .lineTo(margin + contentWidth - 14, transBoxY + 38)
        .stroke();

      doc
        .fillColor('#64748b')
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .text('DEPARTURE', leftX, transBoxY + 44, { width: 140 });

      doc
        .fillColor('#0f172a')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(transport.departure || 'N/A', leftX, transBoxY + 55, { width: 140 });

      doc
        .fillColor('#475569')
        .fontSize(8)
        .font('Helvetica')
        .text(transport.from || 'Origin', leftX, transBoxY + 67, { width: 155 });

      // Middle: Route Arrow & Duration
      const midX = leftX + 160;
      doc
        .fillColor('#94a3b8')
        .fontSize(9)
        .font('Helvetica')
        .text('------------------>', midX, transBoxY + 52, { width: 70, align: 'center' });

      doc
        .fillColor('#64748b')
        .fontSize(7.5)
        .font('Helvetica')
        .text(`Duration: ${transport.duration || 'Direct'}`, midX, transBoxY + 67, { width: 70, align: 'center' });

      // Arrival
      const arrX = midX + 80;
      doc
        .fillColor('#64748b')
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .text('ARRIVAL', arrX, transBoxY + 44, { width: 140 });

      doc
        .fillColor('#0f172a')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(transport.arrival || 'N/A', arrX, transBoxY + 55, { width: 140 });

      doc
        .fillColor('#475569')
        .fontSize(8)
        .font('Helvetica')
        .text(transport.to || 'Destination', arrX, transBoxY + 67, { width: 155 });

      // Right side: Price
      const transportPrice = transport.totalPrice || transport.totalRoundTripCost || booking.amount;
      const rightX = margin + contentWidth - 110;
      doc
        .fillColor('#64748b')
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .text('TRANSPORT FARE', rightX, transBoxY + 10, { width: 96, align: 'right' });

      doc
        .fillColor('#059669')
        .fontSize(11.5)
        .font('Helvetica-Bold')
        .text(formatCurr(transportPrice, booking.currency), rightX, transBoxY + 22, { width: 96, align: 'right' });

      doc
        .fillColor('#94a3b8')
        .fontSize(7.5)
        .font('Helvetica')
        .text(`(${travelersNum} Seats)`, rightX, transBoxY + 35, { width: 96, align: 'right' });

      currentY = transBoxY + transBoxHeight + 14;
    }

    // 3. SECTION: ACCOMMODATION RESERVATION (IF APPLICABLE)
    const hotel = booking.details?.hotel || (booking.type === 'hotel' ? booking.details : null);
    if (hotel) {
      currentY = drawSectionHeader(currentY, 'ACCOMMODATION RESERVATION', 'HOTEL STAY');

      const hotelBoxY = currentY;
      const hotelBoxHeight = 84;
      doc
        .roundedRect(margin, hotelBoxY, contentWidth, hotelBoxHeight, 4)
        .fillAndStroke('#ffffff', '#e2e8f0');

      // Left column: Hotel name and rating
      const leftX = margin + 14;
      doc
        .fillColor('#0f172a')
        .fontSize(10.5)
        .font('Helvetica-Bold')
        .text(hotel.name || 'Demo Hotel & Resort', leftX, hotelBoxY + 10, { width: 340 });

      doc
        .fillColor('#475569')
        .fontSize(8.5)
        .font('Helvetica')
        .text(`Location: ${hotel.area ? hotel.area + ', ' : ''}${hotel.city || destination}    |    Rating: ${hotel.rating || '4.5'} / 5.0`, leftX, hotelBoxY + 24, { width: 340 });

      // Stay timing & dates separator
      doc
        .strokeColor('#f1f5f9')
        .lineWidth(0.5)
        .moveTo(leftX, hotelBoxY + 38)
        .lineTo(margin + contentWidth - 14, hotelBoxY + 38)
        .stroke();

      // Check-In
      const checkInStr = formatDateText(hotel.checkIn || trip?.startDate);
      const checkOutStr = formatDateText(hotel.checkOut || trip?.endDate);

      doc
        .fillColor('#64748b')
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .text('CHECK-IN DATE', leftX, hotelBoxY + 44, { width: 140 });

      doc
        .fillColor('#0f172a')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(checkInStr, leftX, hotelBoxY + 55, { width: 140 });

      doc
        .fillColor('#475569')
        .fontSize(8)
        .font('Helvetica')
        .text('Standard Check-in (12:00 PM)', leftX, hotelBoxY + 67, { width: 140 });

      // Middle: Duration
      const midX = leftX + 160;
      doc
        .fillColor('#94a3b8')
        .fontSize(9)
        .font('Helvetica')
        .text('------------------', midX, hotelBoxY + 52, { width: 70, align: 'center' });

      doc
        .fillColor('#64748b')
        .fontSize(7.5)
        .font('Helvetica')
        .text(`${hotel.nights || 1} Night(s) Stay`, midX, hotelBoxY + 67, { width: 70, align: 'center' });

      // Check-Out
      const arrX = midX + 80;
      doc
        .fillColor('#64748b')
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .text('CHECK-OUT DATE', arrX, hotelBoxY + 44, { width: 140 });

      doc
        .fillColor('#0f172a')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(checkOutStr, arrX, hotelBoxY + 55, { width: 140 });

      doc
        .fillColor('#475569')
        .fontSize(8)
        .font('Helvetica')
        .text('Standard Check-out (11:00 AM)', arrX, hotelBoxY + 67, { width: 140 });

      // Right side: Price
      const hotelPrice = hotel.totalPrice || hotel.totalCost || booking.amount;
      const rightX = margin + contentWidth - 110;
      doc
        .fillColor('#64748b')
        .fontSize(7.5)
        .font('Helvetica-Bold')
        .text('STAY CHARGES', rightX, hotelBoxY + 10, { width: 96, align: 'right' });

      doc
        .fillColor('#059669')
        .fontSize(11.5)
        .font('Helvetica-Bold')
        .text(formatCurr(hotelPrice, booking.currency), rightX, hotelBoxY + 22, { width: 96, align: 'right' });

      doc
        .fillColor('#94a3b8')
        .fontSize(7.5)
        .font('Helvetica')
        .text(`(${hotel.nights || 1} Nights Total)`, rightX, hotelBoxY + 35, { width: 96, align: 'right' });

      currentY = hotelBoxY + hotelBoxHeight + 14;
    }

    // 4. SECTION: PAYMENT & TRANSACTION SETTLEMENT
    currentY = drawSectionHeader(currentY, 'PAYMENT & SETTLEMENT RECEIPT', 'FULLY SETTLED');

    const payBoxY = currentY;
    const payBoxHeight = 92;
    doc
      .roundedRect(margin, payBoxY, contentWidth, payBoxHeight, 4)
      .fillAndStroke('#f8fafc', '#e2e8f0');

    // Left Column: Settlement Metadata
    const payLeftX = margin + 14;
    doc
      .fillColor('#64748b')
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .text('PAYMENT STATUS', payLeftX, payBoxY + 10, { width: 280 });

    doc
      .fillColor('#059669')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('PAID & VERIFIED (TEST MODE / DEMO GATEWAY)', payLeftX, payBoxY + 21, { width: 280 });

    doc
      .fillColor('#64748b')
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .text('TRANSACTION ID', payLeftX, payBoxY + 36, { width: 280 });

    doc
      .fillColor('#1e40af')
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .text(txnId, payLeftX, payBoxY + 47, { width: 280 });

    doc
      .fillColor('#64748b')
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .text('SETTLEMENT DATE & TIME', payLeftX, payBoxY + 62, { width: 280 });

    doc
      .fillColor('#334155')
      .fontSize(8)
      .font('Helvetica')
      .text(new Date(booking.createdAt || Date.now()).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }), payLeftX, payBoxY + 73, { width: 280 });

    // Vertical dividing line
    const payDividerX = margin + 295;
    doc
      .strokeColor('#e2e8f0')
      .lineWidth(0.5)
      .moveTo(payDividerX, payBoxY + 8)
      .lineTo(payDividerX, payBoxY + payBoxHeight - 8)
      .stroke();

    // Right Column: Financial Breakdown
    const payRightX = payDividerX + 14;
    const payRightW = margin + contentWidth - payRightX - 14;

    if (transport && hotel) {
      doc
        .fillColor('#64748b').fontSize(8).font('Helvetica').text('Transportation Total:', payRightX, payBoxY + 10, { width: 110 })
        .fillColor('#0f172a').font('Helvetica-Bold').text(formatCurr(transport.totalPrice || transport.totalRoundTripCost, booking.currency), payRightX, payBoxY + 10, { width: payRightW, align: 'right' });

      doc
        .fillColor('#64748b').fontSize(8).font('Helvetica').text('Accommodation Total:', payRightX, payBoxY + 23, { width: 110 })
        .fillColor('#0f172a').font('Helvetica-Bold').text(formatCurr(hotel.totalPrice || hotel.totalCost, booking.currency), payRightX, payBoxY + 23, { width: payRightW, align: 'right' });

      doc
        .fillColor('#64748b').fontSize(8).font('Helvetica').text('Taxes & Demo Service Fees:', payRightX, payBoxY + 36, { width: 110 })
        .fillColor('#059669').font('Helvetica').text('Included', payRightX, payBoxY + 36, { width: payRightW, align: 'right' });

      doc
        .strokeColor('#cbd5e1')
        .lineWidth(0.75)
        .moveTo(payRightX, payBoxY + 49)
        .lineTo(margin + contentWidth - 14, payBoxY + 49)
        .stroke();

      doc
        .fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold').text('TOTAL AMOUNT PAID', payRightX, payBoxY + 55, { width: 110 });

      doc
        .fillColor('#1e40af')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(formatCurr(booking.amount, booking.currency), payRightX, payBoxY + 65, { width: payRightW, align: 'right' });
    } else {
      doc
        .fillColor('#64748b').fontSize(8).font('Helvetica').text('Base Reservation Amount:', payRightX, payBoxY + 16, { width: 110 })
        .fillColor('#0f172a').font('Helvetica-Bold').text(formatCurr(booking.amount, booking.currency), payRightX, payBoxY + 16, { width: payRightW, align: 'right' });

      doc
        .fillColor('#64748b').fontSize(8).font('Helvetica').text('Taxes & Demo Service Fees:', payRightX, payBoxY + 32, { width: 110 })
        .fillColor('#059669').font('Helvetica').text('Included', payRightX, payBoxY + 32, { width: payRightW, align: 'right' });

      doc
        .strokeColor('#cbd5e1')
        .lineWidth(0.75)
        .moveTo(payRightX, payBoxY + 48)
        .lineTo(margin + contentWidth - 14, payBoxY + 48)
        .stroke();

      doc
        .fillColor('#64748b').fontSize(7.5).font('Helvetica-Bold').text('TOTAL AMOUNT PAID', payRightX, payBoxY + 54, { width: 110 });

      doc
        .fillColor('#1e40af')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(formatCurr(booking.amount, booking.currency), payRightX, payBoxY + 65, { width: payRightW, align: 'right' });
    }

    // 5. SECURITY & GUARANTEE NOTICE BOX
    const noticeY = payBoxY + payBoxHeight + 12;
    doc
      .roundedRect(margin, noticeY, contentWidth, 30, 4)
      .fillAndStroke('#eff6ff', '#bfdbfe');

    doc
      .fillColor('#1d4ed8')
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .text('AUTHENTICATED DEMONSTRATION RECORD:', margin + 10, noticeY + 5, { width: contentWidth - 20 });

    doc
      .fillColor('#1e40af')
      .fontSize(7.5)
      .font('Helvetica')
      .text('This voucher is an authenticated digital record issued by GlobeTrotter AI. In production, this e-ticket is cross-linked directly with live IRCTC/airline PNR systems and hotel property managers for paperless check-in.', margin + 10, noticeY + 15, { width: contentWidth - 20 });

    // 6. FOOTER (Fixed within margin bounds)
    const footerLineY = 780;
    doc
      .strokeColor('#e2e8f0')
      .lineWidth(0.75)
      .moveTo(margin, footerLineY)
      .lineTo(margin + contentWidth, footerLineY)
      .stroke();

    doc
      .fillColor('#94a3b8')
      .fontSize(7.5)
      .font('Helvetica')
      .text(
        `GlobeTrotter Autonomous AI Travel Platform   |   Booking Reference: ${booking.bookingReference}   |   Simulated E-Ticket Voucher`,
        margin,
        788,
        { width: contentWidth, align: 'center', lineBreak: false }
      );

    doc.end();
  } catch (error) {
    console.error('[Generate PDF Error]:', error);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Error generating confirmation PDF',
      });
    }
  }
};

export default {
  prepareBooking,
  getBookingById,
  confirmBooking,
  getUserBookings,
  generateBookingConfirmationPdf,
};
