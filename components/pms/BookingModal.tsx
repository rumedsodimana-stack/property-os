import React, { useState } from 'react';
import { X, User, Mail, Phone, Calendar, Users, CreditCard, Check, AlertCircle, Loader } from 'lucide-react';
import { RoomType } from '../../types';
import { completeBooking, validateBookingRequest, BookingRequest } from '../../services/operations/bookingService';
import { CURRENT_PROPERTY } from '../../services/kernel/config';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    roomType: RoomType | null;
    checkIn: string;
    checkOut: string;
    guests: number;
}

const BookingModal: React.FC<BookingModalProps> = ({
    isOpen,
    onClose,
    roomType,
    checkIn,
    checkOut,
    guests
}) => {
    const [step, setStep] = useState(1); // 1: Guest Info, 2: Payment, 3: Confirmation
    const [isProcessing, setIsProcessing] = useState(false);
    const [confirmationId, setConfirmationId] = useState('');
    const [errors, setErrors] = useState<string[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        guestName: '',
        guestEmail: '',
        guestPhone: '',
        adults: guests,
        children: 0,
        specialRequests: '',
        cardNumber: '',
        cardExpiry: '',
        cardCvv: '',
        billingZip: ''
    });

    if (!isOpen || !roomType) return null;

    // Calculate details
    const calculateNights = () => {
        const start = new Date(checkIn);
        const end = new Date(checkOut);
        const diff = end.getTime() - start.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const nights = calculateNights();
    const subtotal = nights * roomType.baseRate;
    const tax = subtotal * 0.15; // 15% tax
    const total = subtotal + tax;

    // Handle form changes
    const handleChange = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors([]); // Clear errors on change
    };

    // Validate and proceed to next step
    const handleNext = () => {
        if (step === 1) {
            const bookingRequest: Partial<BookingRequest> = {
                guestName: formData.guestName,
                guestEmail: formData.guestEmail,
                guestPhone: formData.guestPhone,
                adults: formData.adults,
                checkIn: new Date(checkIn),
                checkOut: new Date(checkOut),
                roomTypeId: roomType.id
            };

            const validationErrors = validateBookingRequest(bookingRequest);
            if (validationErrors.length > 0) {
                setErrors(validationErrors);
                return;
            }
            setStep(2);
        } else if (step === 2) {
            handleConfirmBooking();
        }
    };

    // Complete booking
    const handleConfirmBooking = async () => {
        setIsProcessing(true);
        setErrors([]);

        const bookingRequest: BookingRequest = {
            roomTypeId: roomType.id,
            roomTypeName: roomType.name,
            guestName: formData.guestName,
            guestEmail: formData.guestEmail,
            guestPhone: formData.guestPhone,
            checkIn: new Date(checkIn),
            checkOut: new Date(checkOut),
            adults: formData.adults,
            children: formData.children,
            specialRequests: formData.specialRequests,
            ratePerNight: roomType.baseRate
        };

        try {
            const result = await completeBooking(bookingRequest);

            if (result.success && result.reservation) {
                setConfirmationId(result.reservation.id);
                setStep(3);
            } else {
                setErrors([result.error || 'Booking failed. Please try again.']);
            }
        } catch (error: any) {
            setErrors([error.message || 'An unexpected error occurred.']);
        } finally {
            setIsProcessing(false);
        }
    };

    // Render guest information form
    const renderGuestInfo = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Full Name *
                </label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        value={formData.guestName}
                        onChange={(e) => handleChange('guestName', e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none transition"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Email Address *
                </label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="email"
                        value={formData.guestEmail}
                        onChange={(e) => handleChange('guestEmail', e.target.value)}
                        placeholder="john@example.com"
                        className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none transition"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Phone Number *
                </label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="tel"
                        value={formData.guestPhone}
                        onChange={(e) => handleChange('guestPhone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none transition"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Adults *
                    </label>
                    <select
                        value={formData.adults}
                        onChange={(e) => handleChange('adults', Number(e.target.value))}
                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:border-violet-500 focus:outline-none transition"
                    >
                        {[1, 2, 3, 4, 5, 6].map(n => (
                            <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Children
                    </label>
                    <select
                        value={formData.children}
                        onChange={(e) => handleChange('children', Number(e.target.value))}
                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:border-violet-500 focus:outline-none transition"
                    >
                        {[0, 1, 2, 3, 4].map(n => (
                            <option key={n} value={n}>{n} {n === 1 ? 'Child' : 'Children'}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Special Requests (Optional)
                </label>
                <textarea
                    value={formData.specialRequests}
                    onChange={(e) => handleChange('specialRequests', e.target.value)}
                    placeholder="High floor, non-smoking, extra pillows..."
                    rows={3}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none transition resize-none"
                />
            </div>
        </div>
    );

    // Render payment form
    const renderPayment = () => (
        <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-amber-200 flex items-center gap-2">
                    <AlertCircle size={16} />
                    Payment simulation - No actual charge will be made
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Card Number
                </label>
                <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        value={formData.cardNumber}
                        onChange={(e) => handleChange('cardNumber', e.target.value)}
                        placeholder="4242 4242 4242 4242"
                        maxLength={19}
                        className="w-full pl-11 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none transition"
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Expiry Date
                    </label>
                    <input
                        type="text"
                        value={formData.cardExpiry}
                        onChange={(e) => handleChange('cardExpiry', e.target.value)}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none transition"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                        CVV
                    </label>
                    <input
                        type="text"
                        value={formData.cardCvv}
                        onChange={(e) => handleChange('cardCvv', e.target.value)}
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none transition"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Billing ZIP Code
                </label>
                <input
                    type="text"
                    value={formData.billingZip}
                    onChange={(e) => handleChange('billingZip', e.target.value)}
                    placeholder="12345"
                    maxLength={10}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none transition"
                />
            </div>
        </div>
    );

    // Render confirmation
    const renderConfirmation = () => (
        <div className="text-center py-8 space-y-6">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-10 h-10 text-emerald-500" />
            </div>
            <div>
                <h3 className="text-2xl font-semibold text-white mb-2">Booking Confirmed!</h3>
                <p className="text-zinc-400">Your reservation has been successfully created.</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left space-y-3">
                <div className="flex justify-between">
                    <span className="text-zinc-400">Confirmation Number:</span>
                    <span className="text-white font-mono font-semibold">{confirmationId}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-400">Guest Name:</span>
                    <span className="text-white">{formData.guestName}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-400">Email:</span>
                    <span className="text-white">{formData.guestEmail}</span>
                </div>
                <div className="border-t border-zinc-800 pt-3 mt-3">
                    <div className="flex justify-between">
                        <span className="text-zinc-400">Room Type:</span>
                        <span className="text-white">{roomType.name}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-400">Check-in:</span>
                        <span className="text-white">{new Date(checkIn).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-zinc-400">Check-out:</span>
                        <span className="text-white">{new Date(checkOut).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg mt-2">
                        <span className="text-zinc-300">Total:</span>
                        <span className="text-emerald-400">{CURRENT_PROPERTY.currency} {total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            <p className="text-sm text-zinc-500">
                A confirmation email has been sent to {formData.guestEmail}
            </p>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={step === 3 ? onClose : undefined}
            />

            {/* Modal */}
            <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                    <div>
                        <h2 className="text-2xl font-semibold text-white">
                            {step === 1 && 'Guest Information'}
                            {step === 2 && 'Payment Details'}
                            {step === 3 && 'Booking Confirmed'}
                        </h2>
                        {step < 3 && (
                            <p className="text-sm text-zinc-400 mt-1">Step {step} of 2</p>
                        )}
                    </div>
                    {step === 3 && (
                        <button
                            onClick={onClose}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Reservation Summary */}
                    {step < 3 && (
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
                            <h3 className="text-sm font-semibold text-zinc-300 mb-3">Reservation Summary</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Room:</span>
                                    <span className="text-white font-medium">{roomType.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Dates:</span>
                                    <span className="text-white">
                                        {new Date(checkIn).toLocaleDateString()} - {new Date(checkOut).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Nights:</span>
                                    <span className="text-white">{nights}</span>
                                </div>
                                <div className="border-t border-zinc-800 pt-2 mt-2">
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Subtotal:</span>
                                        <span className="text-white">{CURRENT_PROPERTY.currency} {subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-zinc-400">Tax (15%):</span>
                                        <span className="text-white">{CURRENT_PROPERTY.currency} {tax.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-base mt-2">
                                        <span className="text-zinc-300">Total:</span>
                                        <span className="text-emerald-400">{CURRENT_PROPERTY.currency} {total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Errors */}
                    {errors.length > 0 && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
                            {errors.map((error, idx) => (
                                <p key={idx} className="text-sm text-red-400 flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {error}
                                </p>
                            ))}
                        </div>
                    )}

                    {/* Forms */}
                    {step === 1 && renderGuestInfo()}
                    {step === 2 && renderPayment()}
                    {step === 3 && renderConfirmation()}
                </div>

                {/* Footer */}
                {step < 3 && (
                    <div className="flex items-center justify-between p-6 border-t border-zinc-800 bg-zinc-950">
                        <button
                            onClick={step === 1 ? onClose : () => setStep(step - 1)}
                            disabled={isProcessing}
                            className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600 text-white rounded-lg transition font-medium"
                        >
                            {step === 1 ? 'Cancel' : 'Back'}
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={isProcessing}
                            className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-900 disabled:text-violet-400 text-white rounded-lg transition font-medium flex items-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    {step === 1 ? 'Continue to Payment' : 'Confirm Booking'}
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingModal;
