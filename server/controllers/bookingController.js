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

      // Search trusted DEMO_TRAINS dataset
      const train = DEMO_TRAINS.find(
        (t) => t.id === targetOptionId || t.trainNumber === targetOptionId
      );

      if (!train) {
        return res.status(404).json({
          success: false,
          message: 'Invalid transport option. Selected train was not found in trusted inventory.',
        });
      }

      calculatedAmount = Number(train.price) * travelerCount;
      provider = 'Indian Railways (Demo Simulation)';
      referenceId = train.id;

      details = {
        transportType: 'train',
        trainNumber: train.trainNumber,
        name: train.name,
        from: train.from,
        to: train.to,
        fromCity: train.fromCity || train.from,
        toCity: train.toCity || train.to,
        departure: train.departure,
        arrival: train.arrival,
        duration: train.duration,
        class: train.class,
        pricePerPerson: Number(train.price),
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

      // Search trusted DEMO_HOTELS dataset
      const hotel = DEMO_HOTELS.find((h) => h.id === targetOptionId);

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

      const train = DEMO_TRAINS.find((t) => t.id === targetTrainId || t.trainNumber === targetTrainId);
      const hotel = DEMO_HOTELS.find((h) => h.id === targetHotelId);

      if (!train || !hotel) {
        return res.status(404).json({
          success: false,
          message: 'One or more package items were not found in trusted demo inventory.',
        });
      }

      const nights = calculateNights(trip.startDate, trip.endDate);
      const transportTotal = Number(train.price) * travelerCount;
      const hotelTotal = Number(hotel.pricePerNight) * nights;
      calculatedAmount = transportTotal + hotelTotal;

      provider = 'GlobeThrottle Demo Travel Package';
      referenceId = `${train.id}_${hotel.id}`;

      details = {
        isPackage: true,
        transport: {
          trainNumber: train.trainNumber,
          name: train.name,
          from: train.from,
          to: train.to,
          departure: train.departure,
          arrival: train.arrival,
          duration: train.duration,
          class: train.class,
          pricePerPerson: Number(train.price),
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
    const stops = trip ? await Stop.find({ trip: trip._id }).sort({ order: 1 }) : [];
    const destination = stops.length > 0 ? stops.map((s) => s.city).join(' → ') : (trip ? trip.name : 'Destination');

    // Fetch Payment
    const payment = await Payment.findOne({ booking: booking._id, status: 'success' }).sort({ createdAt: -1 });
    const txnId = payment?.transactionId || booking.details?.payment?.transactionId || 'TEST-TXN-SIMULATED';

    // Set PDF response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="GlobeThrottle-Demo-Confirmation-${booking.bookingReference}.pdf"`
    );

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    // Branding & Header
    doc
      .fillColor('#2563eb')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('GlobeThrottle', { continued: true })
      .fillColor('#64748b')
      .fontSize(12)
      .font('Helvetica')
      .text('  |  Autonomous AI Travel Planner', { align: 'left' });

    doc.moveDown(0.4);

    // Document Title
    doc
      .fillColor('#0f172a')
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('DEMO BOOKING CONFIRMATION');

    doc.moveDown(0.4);

    // Prominent Disclaimer Box
    const disclaimerTop = doc.y;
    doc
      .rect(40, disclaimerTop, 515, 42)
      .fillAndStroke('#fef3c7', '#f59e0b');

    doc
      .fillColor('#92400e')
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .text(
        'DEMO DOCUMENT — This is a simulated travel booking created for demonstration purposes. It is not a real reservation or payment receipt.',
        50,
        disclaimerTop + 14,
        { width: 495, align: 'center' }
      );

    doc.y = disclaimerTop + 54;
    doc.moveDown(0.5);

    // Summary Metadata Box
    doc
      .rect(40, doc.y, 515, 65)
      .fillAndStroke('#f8fafc', '#e2e8f0');

    const metaY = doc.y + 12;
    doc
      .fillColor('#64748b')
      .fontSize(9)
      .font('Helvetica')
      .text('BOOKING REFERENCE', 55, metaY)
      .fillColor('#0f172a')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(booking.bookingReference, 55, metaY + 12);

    doc
      .fillColor('#64748b')
      .fontSize(9)
      .font('Helvetica')
      .text('BOOKING STATUS', 225, metaY)
      .fillColor(booking.status === 'confirmed' ? '#16a34a' : '#d97706')
      .fontSize(11)
      .font('Helvetica-Bold')
      .text(booking.status.toUpperCase() + ' (DEMO)', 225, metaY + 12);

    doc
      .fillColor('#64748b')
      .fontSize(9)
      .font('Helvetica')
      .text('TEST TRANSACTION ID', 380, metaY)
      .fillColor('#0f172a')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(txnId, 380, metaY + 12);

    doc.y = metaY + 45;
    doc.moveDown(1);

    // 1. Trip Details Section
    doc
      .fillColor('#1e293b')
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('1. Trip Details');

    doc
      .strokeColor('#cbd5e1')
      .lineWidth(0.75)
      .moveTo(40, doc.y + 2)
      .lineTo(555, doc.y + 2)
      .stroke();

    doc.moveDown(0.6);

    const tripDates = trip
      ? `${new Date(trip.startDate).toLocaleDateString()} to ${new Date(trip.endDate).toLocaleDateString()}`
      : 'Scheduled Dates';
    const travelersCount = trip?.travelers?.length || booking.details?.travelers || 1;

    doc
      .fillColor('#334155')
      .fontSize(9.5)
      .font('Helvetica-Bold')
      .text('Trip Name: ', { continued: true })
      .font('Helvetica')
      .text(trip?.name || 'AI Planned Trip')
      .font('Helvetica-Bold')
      .text('Destination: ', { continued: true })
      .font('Helvetica')
      .text(destination)
      .font('Helvetica-Bold')
      .text('Travel Dates: ', { continued: true })
      .font('Helvetica')
      .text(tripDates)
      .font('Helvetica-Bold')
      .text('Travelers: ', { continued: true })
      .font('Helvetica')
      .text(`${travelersCount} Traveler(s)`);

    doc.moveDown(1);

    // 2. Transport Details Section
    const transport = booking.details?.transport || (booking.type === 'transport' ? booking.details : null);
    if (transport) {
      doc
        .fillColor('#1e293b')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('2. Transport Reservation (Demo)');

      doc
        .strokeColor('#cbd5e1')
        .lineWidth(0.75)
        .moveTo(40, doc.y + 2)
        .lineTo(555, doc.y + 2)
        .stroke();

      doc.moveDown(0.6);

      doc
        .fillColor('#334155')
        .fontSize(9.5)
        .font('Helvetica-Bold')
        .text('Service: ', { continued: true })
        .font('Helvetica')
        .text(`${transport.name || 'Train'} (#${transport.trainNumber || 'N/A'}) - Class: ${transport.class || 'Standard'}`)
        .font('Helvetica-Bold')
        .text('Route: ', { continued: true })
        .font('Helvetica')
        .text(`${transport.from || 'Origin'} -> ${transport.to || 'Destination'}`)
        .font('Helvetica-Bold')
        .text('Schedule: ', { continued: true })
        .font('Helvetica')
        .text(`Departure: ${transport.departure || 'N/A'} | Arrival: ${transport.arrival || 'N/A'} | Duration: ${transport.duration || 'N/A'}`)
        .font('Helvetica-Bold')
        .text('Transport Amount: ', { continued: true })
        .font('Helvetica')
        .text(`${booking.currency} ${Number(transport.totalPrice || booking.amount).toLocaleString()}`);

      doc.moveDown(1);
    }

    // 3. Hotel Details Section
    const hotel = booking.details?.hotel || (booking.type === 'hotel' ? booking.details : null);
    if (hotel) {
      doc
        .fillColor('#1e293b')
        .fontSize(13)
        .font('Helvetica-Bold')
        .text('3. Accommodation Reservation (Demo)');

      doc
        .strokeColor('#cbd5e1')
        .lineWidth(0.75)
        .moveTo(40, doc.y + 2)
        .lineTo(555, doc.y + 2)
        .stroke();

      doc.moveDown(0.6);

      doc
        .fillColor('#334155')
        .fontSize(9.5)
        .font('Helvetica-Bold')
        .text('Property: ', { continued: true })
        .font('Helvetica')
        .text(`${hotel.name || 'Demo Hotel'} (Rating: ${hotel.rating || '4.5'}/5.0)`)
        .font('Helvetica-Bold')
        .text('Location: ', { continued: true })
        .font('Helvetica')
        .text(`${hotel.area || ''} ${hotel.city || ''}`)
        .font('Helvetica-Bold')
        .text('Stay Duration: ', { continued: true })
        .font('Helvetica')
        .text(`${hotel.nights || 3} Night(s) | Check-In: ${new Date(hotel.checkIn || trip?.startDate).toLocaleDateString()} | Check-Out: ${new Date(hotel.checkOut || trip?.endDate).toLocaleDateString()}`)
        .font('Helvetica-Bold')
        .text('Hotel Amount: ', { continued: true })
        .font('Helvetica')
        .text(`${booking.currency} ${Number(hotel.totalPrice || booking.amount).toLocaleString()}`);

      doc.moveDown(1);
    }

    // 4. Financial Summary
    doc
      .fillColor('#1e293b')
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('4. Financial & Payment Summary');

    doc
      .strokeColor('#cbd5e1')
      .lineWidth(0.75)
      .moveTo(40, doc.y + 2)
      .lineTo(555, doc.y + 2)
      .stroke();

    doc.moveDown(0.6);

    doc
      .fillColor('#334155')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Total Validated Amount: ', { continued: true })
      .fillColor('#1e3a8a')
      .text(`${booking.currency} ${Number(booking.amount).toLocaleString()}`)
      .fillColor('#334155')
      .font('Helvetica-Bold')
      .text('Payment Gateway: ', { continued: true })
      .font('Helvetica')
      .text('Simulated Test Gateway (testMode: true)')
      .font('Helvetica-Bold')
      .text('Booking Date: ', { continued: true })
      .font('Helvetica')
      .text(new Date(booking.createdAt).toLocaleString());

    doc.moveDown(2);

    // Footer
    doc
      .strokeColor('#e2e8f0')
      .lineWidth(0.5)
      .moveTo(40, 780)
      .lineTo(555, 780)
      .stroke();

    doc
      .fillColor('#94a3b8')
      .fontSize(8)
      .font('Helvetica')
      .text('GlobeThrottle Demo Travel System • Hackathon & Prototype Demonstration • No Real Travel Booked', 40, 788, { align: 'center', width: 515 });

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
