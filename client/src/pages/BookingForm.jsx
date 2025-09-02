import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
	ArrowLeft, 
	Calendar as CalendarIcon, 
	Clock, 
	Users, 
	Wrench,
	AlertCircle,
	CheckCircle,
	Loader2
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import printer3d from "@/assets/3d-printer-hero.jpg";
import { EquipmentAPI, BookingAPI, getUser } from "@/lib/api";

const BookingForm = () => {
	const { id } = useParams();
	const { toast } = useToast();
	const navigate = useNavigate();
  
		const [selectedDate, setSelectedDate] = useState();
		const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
		const [selectedTime, setSelectedTime] = useState("");
		const [duration, setDuration] = useState("");
	const [purpose, setPurpose] = useState("");
	const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
	const [availabilityResult, setAvailabilityResult] = useState(null);
	const [isBooking, setIsBooking] = useState(false);
	const [timeOpen, setTimeOpen] = useState(false);

	// Reset all form fields after successful booking
	const resetForm = () => {
		setSelectedDate(undefined);
		setSelectedTime("");
		setDuration("");
		setPurpose("");
		setAvailabilityResult(null);
		setTimeOpen(false);
	};

	// Equipment loaded from backend
	const [equipment, setEquipment] = useState(null);
	const [loadingEq, setLoadingEq] = useState(true);
	const [eqError, setEqError] = useState("");

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				setLoadingEq(true);
				const data = await EquipmentAPI.get(id);
				if (cancelled) return;
				const mapped = {
					id: data._id,
					name: data.name,
					category: data.category,
					image: EquipmentAPI.imageUrl(data._id),
					bookingUnitMinutes: data.bookingMinutes ?? 30,
					capacity: data.capacity ?? 1,
				};
				setEquipment(mapped);
				setEqError("");
			} catch (err) {
				console.error(err);
				setEqError(err.message || "Failed to load equipment");
				setEquipment({
					id,
					name: "Equipment",
					category: "",
					image: printer3d,
					bookingUnitMinutes: 60,
					capacity: 1,
				});
			} finally {
				if (!cancelled) setLoadingEq(false);
			}
		})();
		return () => { cancelled = true; };
	}, [id]);

		// Helpers
		const formatDuration = (mins) => {
			const m = parseInt(mins);
			if (!m || isNaN(m)) return "";
			const h = Math.floor(m / 60);
			const rem = m % 60;
			if (h && rem) return `${h} hour${h>1?'s':''} ${rem} min`;
			if (h) return `${h} hour${h>1?'s':''}`;
			return `${rem} min`;
		};

		const handleDurationChange = (e) => {
			const val = e.target.value;
			// allow empty input for UX
			if (val === "") {
				setDuration("");
				return;
			}
			const n = parseInt(val, 10);
			if (isNaN(n) || n < 0) {
				setDuration("");
				return;
			}
			if (equipment && n > equipment.bookingUnitMinutes) {
				toast({
					title: "Invalid Duration",
					description: "Duration cannot be higher than booking unit.",
					variant: "destructive"
				});
				setDuration("0");
				return;
			}
			setDuration(String(n));
		};

	// Time picker state and helpers
	const timeRef = useRef(null);
	const pad2 = (n) => String(n).padStart(2, '0');
	const to24h = (h12, m, mer) => {
		let h = Number(h12);
		if (mer === 'AM') {
			if (h === 12) h = 0;
		} else {
			if (h !== 12) h += 12;
		}
		return `${pad2(h)}:${pad2(m)}`;
	};
	const from24h = (hhmm) => {
		if (!hhmm || !/^[0-2]\d:[0-5]\d$/.test(hhmm)) return { hour: 9, minute: 0, meridiem: 'AM' };
		const [hStr, mStr] = hhmm.split(':');
		let h = Number(hStr);
		const meridiem = h >= 12 ? 'PM' : 'AM';
		if (h === 0) h = 12; else if (h > 12) h = h - 12;
		return { hour: h, minute: Number(mStr), meridiem };
	};
	const initialParts = from24h(selectedTime);
	const [hour12, setHour12] = useState(initialParts.hour);
	const [minute, setMinute] = useState(initialParts.minute);
	const [meridiem, setMeridiem] = useState(initialParts.meridiem);

	useEffect(() => {
		// keep local parts in sync when selectedTime changes externally
		const p = from24h(selectedTime);
		setHour12(p.hour);
		setMinute(p.minute);
		setMeridiem(p.meridiem);
	}, [selectedTime]);

	const chooseHour = (h) => {
		setHour12(h);
		setSelectedTime(to24h(h, minute, meridiem));
	};
	const chooseMinute = (m) => {
		setMinute(m);
		setSelectedTime(to24h(hour12, m, meridiem));
	};
	const chooseMeridiem = (mer) => {
		setMeridiem(mer);
		setSelectedTime(to24h(hour12, minute, mer));
	};

	const handleCheckAvailability = async () => {
		if (!selectedDate || !selectedTime || !duration) {
			toast({
				title: "Missing Information",
				description: "Please select date, time, and duration.",
				variant: "destructive"
			});
			return;
		}

		setIsCheckingAvailability(true);
		try {
			const payload = {
				equipmentId: id,
				date: format(selectedDate, 'yyyy-MM-dd'),
				time: selectedTime,
				durationMinutes: parseInt(duration)
			};
						const res = await BookingAPI.checkAvailability(payload);
			setAvailabilityResult(res);
			if (res.available) {
				toast({ title: "Slot Available!", description: "The selected time slot is available for booking." });
			} else {
							toast({ title: "Slot Unavailable", description: "The equipment is booked or under maintenance during that time.", variant: 'destructive' });
			}
		} catch (error) {
			toast({ title: 'Availability check failed', description: error.message || 'Please try again.', variant: 'destructive' });
		} finally {
			setIsCheckingAvailability(false);
		}
	};

	const handleConfirmBooking = async () => {
		if (!availabilityResult?.available) {
			toast({
				title: "Cannot Book",
				description: "Please check availability first or select an available slot.",
				variant: "destructive"
			});
			return;
		}

		setIsBooking(true);
		try {
			const payload = {
				equipmentId: id,
				date: format(selectedDate, 'yyyy-MM-dd'),
				time: selectedTime,
				durationMinutes: parseInt(duration),
				purpose: purpose.trim(),
			};
			const res = await BookingAPI.create(payload);
			toast({ title: 'Booking Confirmed!', description: `Your booking for ${equipment.name} has been confirmed.` });
			// Reset the form after success and redirect to equipment list
			resetForm();
			navigate('/equipment');
		} catch (error) {
			// If server returns suggestions on conflict
			const msg = error.message || 'There was an error creating your booking.';
			toast({ title: 'Booking Failed', description: msg, variant: 'destructive' });
		} finally {
			setIsBooking(false);
		}
	};

	const selectSuggestedSlot = (slot) => {
		setSelectedDate(new Date(slot.date));
		setSelectedTime(slot.time);
		setAvailabilityResult(null); // Reset to check new slot
	};

	return (
		<div className="min-h-screen bg-background">

			<div className="container mx-auto px-4 py-8">
				<div className="grid lg:grid-cols-3 gap-8">
					{/* Booking Form */}
					<div className="lg:col-span-2 space-y-6">
						<Card className="shadow-card">
							<CardHeader>
								<CardTitle className="text-2xl">New Booking Request</CardTitle>
											<CardDescription>
												Fill in the details for your equipment booking. Duration cannot exceed {equipment?.bookingUnitMinutes ?? 60} minutes.
											</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								{/* Date Selection */}
												<div className="space-y-2">
													<Label htmlFor="date">Select Date</Label>
													<Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
														<PopoverTrigger asChild>
															<Button
																variant="outline"
																className={cn(
																	"w-full justify-start text-left font-normal",
																	!selectedDate && "text-muted-foreground"
																)}
																onClick={() => setIsDatePickerOpen(true)}
															>
																<CalendarIcon className="mr-2 h-4 w-4" />
																{selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
															</Button>
														</PopoverTrigger>
														<PopoverContent className="w-auto p-0" align="start">
															<Calendar
																mode="single"
																selected={selectedDate}
																onSelect={(date) => { if (date) { setSelectedDate(date); setIsDatePickerOpen(false); } }}
																disabled={(date) => date < new Date()}
																initialFocus
																className="p-3 pointer-events-auto"
															/>
														</PopoverContent>
													</Popover>
												</div>

								{/* Time Selection */}
												<div className="grid md:grid-cols-2 gap-4">
													<div className="space-y-2">
														<Label htmlFor="time">Start Time</Label>
														<Popover open={timeOpen} onOpenChange={setTimeOpen}>
															<PopoverTrigger asChild>
																<div className="relative">
																	<Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
																	<Input
																		id="time"
																		ref={timeRef}
																		readOnly
																		value={selectedTime ? `${pad2(hour12)}:${pad2(minute)} ${meridiem}` : ""}
																		placeholder="Select time"
																		onClick={() => setTimeOpen(true)}
																		className="pl-9 cursor-pointer"
																	/>
																</div>
															</PopoverTrigger>
															<PopoverContent align="start" className="w-auto p-0">
																<div className="flex gap-1 p-2">
																	{/* Hours */}
																	<ScrollArea className="h-56 w-16 rounded-md border bg-background">
																		<div className="p-1">
																			{Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
																				const active = h === hour12;
																				return (
																					<button
																						type="button"
																						key={h}
																						onClick={() => chooseHour(h)}
																						className={cn(
																							"w-full text-sm px-2 py-1.5 rounded-md text-left hover:bg-accent",
																							active && "bg-primary text-primary-foreground hover:bg-primary"
																						)}
																					>
																						{pad2(h)}
																					</button>
																				);
																			})}
																		</div>
																	</ScrollArea>

																	{/* Minutes */}
																	<ScrollArea className="h-56 w-16 rounded-md border bg-background">
																		<div className="p-1">
																			{Array.from({ length: 60 }, (_, m) => m).map((m) => {
																				const active = m === minute;
																				return (
																					<button
																						type="button"
																						key={m}
																						onClick={() => chooseMinute(m)}
																						className={cn(
																							"w-full text-sm px-2 py-1.5 rounded-md text-left hover:bg-accent",
																							active && "bg-primary text-primary-foreground hover:bg-primary"
																						)}
																					>
																						{pad2(m)}
																					</button>
																				);
																			})}
																		</div>
																	</ScrollArea>

																	{/* Meridiem */}
																	<ScrollArea className="h-56 w-16 rounded-md border bg-background">
																		<div className="p-1">
																			{['AM', 'PM'].map((mer) => {
																				const active = mer === meridiem;
																				return (
																					<button
																						type="button"
																						key={mer}
																						onClick={() => chooseMeridiem(mer)}
																						className={cn(
																							"w-full text-sm px-2 py-1.5 rounded-md text-left hover:bg-accent",
																							active && "bg-primary text-primary-foreground hover:bg-primary"
																						)}
																					>
																						{mer}
																					</button>
																				);
																			})}
																		</div>
																	</ScrollArea>
																</div>
															</PopoverContent>
														</Popover>
													</div>

													<div className="space-y-2">
														<Label htmlFor="duration">Duration (minutes)</Label>
														<div className="relative">
															<Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
															<Input
																id="duration"
																type="number"
																min="0"
																inputMode="numeric"
																placeholder={`Max ${equipment?.bookingUnitMinutes ?? 60}`}
																value={duration}
																onChange={handleDurationChange}
																className="pl-9"
															/>
														</div>
													</div>
												</div>

								{/* Purpose */}
								<div className="space-y-2">
									<Label htmlFor="purpose">Purpose/Project Description</Label>
									<Textarea
										id="purpose"
										placeholder="Briefly describe what you'll be using the equipment for..."
										value={purpose}
										onChange={(e) => setPurpose(e.target.value)}
										className="min-h-[100px]"
									/>
								</div>

								{/* Check Availability Button */}
								<Button 
									onClick={handleCheckAvailability}
									disabled={isCheckingAvailability || !selectedDate || !selectedTime || !duration}
									className="w-full"
									variant="hero"
								>
									  {isCheckingAvailability ? (
										<>
											<Loader2 className="w-4 h-4 mr-2 animate-spin" />
											Checking Availability...
										</>
									) : (
										<>
											<CheckCircle className="w-4 h-4 mr-2" />
											Check Availability
										</>
									)}
								</Button>

								{/* Availability Results */}
								{availabilityResult && (
									<Card className={cn(
										"border-2",
										availabilityResult.available 
											? "border-green-200 bg-green-50/50" 
											: "border-amber-200 bg-amber-50/50"
									)}>
										<CardContent className="pt-6">
											{availabilityResult.available ? (
												<div className="flex items-center text-green-700">
													<CheckCircle className="w-5 h-5 mr-2" />
													<div>
														<div className="font-semibold">Slot Available!</div>
																					<div className="text-sm">
																						{selectedDate && format(selectedDate, "PPP")} at {selectedTime} 
																						{duration && ` for ${formatDuration(duration)}`}
																					</div>
													</div>
												</div>
											) : (
												<div className="space-y-4">
													<div className="flex items-center text-amber-700">
														<AlertCircle className="w-5 h-5 mr-2" />
														<div>
															<div className="font-semibold">Slot Unavailable</div>
															<div className="text-sm">The selected time slot is already booked.</div>
														</div>
													</div>
                          
													{availabilityResult.suggestedSlots && (
														<div>
															<div className="text-sm font-medium text-amber-800 mb-2">
																Suggested Alternative Times:
															</div>
															<div className="space-y-2">
																{availabilityResult.suggestedSlots.map((slot, index) => (
																	<Button
																		key={index}
																		variant="outline"
																		size="sm"
																		onClick={() => selectSuggestedSlot(slot)}
																		className="mr-2 mb-2"
																	>
																		{format(new Date(slot.date), "MMM d")} at {slot.time}
																	</Button>
																))}
															</div>
														</div>
													)}
												</div>
											)}
										</CardContent>
									</Card>
								)}

								{/* Confirm Booking Button */}
								{availabilityResult?.available && (
									<Button 
										onClick={handleConfirmBooking}
										disabled={isBooking || !purpose.trim()}
										className="w-full"
										variant="accent"
										size="lg"
									>
										{isBooking ? (
											<>
												<Loader2 className="w-4 h-4 mr-2 animate-spin" />
												Creating Booking...
											</>
										) : (
											<>
												<CalendarIcon className="w-4 h-4 mr-2" />
												Confirm Booking
											</>
										)}
									</Button>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Sidebar with Equipment Info */}
					<div className="space-y-6">
						<Card className="shadow-card sticky top-24">
							<div className="relative">
								<img 
												src={equipment?.image} 
												alt={equipment?.name}
									className="w-full h-32 object-cover rounded-t-lg"
								/>
								<Badge variant="secondary" className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm">
												{equipment?.category}
								</Badge>
							</div>
              
							<CardHeader>
												<CardTitle className="text-lg">{equipment?.name || (loadingEq ? 'Loading...' : 'Equipment')}</CardTitle>
							</CardHeader>
              
							<CardContent className="space-y-4">
								<div className="space-y-3">
									<div className="flex items-center justify_between text-sm">
										<span className="font-medium">Booking Unit</span>
										<div className="flex items_center text-muted-foreground">
											<Clock className="w-4 h-4 mr-1" />
																{equipment?.bookingUnitMinutes} minutes
										</div>
									</div>
                  
									<div className="flex items-center justify-between text-sm">
										<span className="font-medium">Capacity</span>
										<div className="flex items-center text-muted-foreground">
											<Users className="w-4 h-4 mr-1" />
																{equipment?.capacity} user{(equipment?.capacity || 0) > 1 ? 's' : ''}
										</div>
									</div>
								</div>
                
								<div className="pt-4 border-t border-border">
									<div className="text-xs text-muted-foreground space-y-1">
										<div>• Always arrive on time for your booking</div>
										<div>• Clean up after use</div>
										<div>• Report any issues immediately</div>
										<div>• Cancel at least 2 hours in advance</div>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
};

export default BookingForm;
