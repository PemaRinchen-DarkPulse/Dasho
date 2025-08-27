import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
	ArrowLeft, 
	Calendar, 
	Clock, 
	Users, 
	Settings, 
	Wrench,
	CheckCircle,
	AlertCircle,
	Info
} from "lucide-react";
import { EquipmentAPI } from "@/lib/api";

const EquipmentDetail = () => {
	const { id } = useParams();
	const [equipment, setEquipment] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				setLoading(true);
				const list = await EquipmentAPI.list();
				if (cancelled) return;
				const found = (list || []).find((e) => e._id === id);
				if (!found) {
					setError("Equipment not found");
					setEquipment(null);
					return;
				}
				const mapped = {
					id: found._id,
					name: found.name,
					category: found.category,
					description: found.description || "",
					image: EquipmentAPI.imageUrl(found._id),
					capacity: found.capacity ?? 1,
					bookingUnitMinutes: found.bookingMinutes ?? 30,
					status: found.status === "maintenance" ? "maintenance" : "available",
					features: Array.isArray(found.keyFeatures) ? found.keyFeatures : [],
					specifications: Array.isArray(found.technicalSpecifications)
						? Object.fromEntries(found.technicalSpecifications.map((kv) => [kv.key, kv.value]))
						: {},
					safetyRequirements: Array.isArray(found.safetyRequirements) ? found.safetyRequirements : [],
					usageGuidelines: Array.isArray(found.usageGuidelines) ? found.usageGuidelines : [],
					maintenanceSchedule: found.updatedAt
						? `Last updated: ${new Date(found.updatedAt).toISOString().slice(0, 10)}`
						: "",
				};
				setEquipment(mapped);
				setError("");
			} catch (err) {
				console.error(err);
				setError(err.message || "Failed to load equipment");
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [id]);

	if (!loading && !equipment) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-foreground mb-4">Equipment Not Found</h1>
					<Button asChild>
						<Link to="/equipment">Back to Equipment</Link>
					</Button>
				</div>
			</div>
		);
	}

	const imageUrl = equipment?.image;

	const getStatusColor = (status) => {
		switch (status) {
			case "available": return "bg-green-500/10 text-green-700 border-green-200";
			case "in-use": return "bg-blue-500/10 text-blue-700 border-blue-200";
			case "maintenance": return "bg-amber-500/10 text-amber-700 border-amber-200";
			default: return "bg-gray-500/10 text-gray-700 border-gray-200";
		}
	};

	const getStatusIcon = (status) => {
		switch (status) {
			case "available": return <CheckCircle className="w-4 h-4" />;
			case "in-use": return <Clock className="w-4 h-4" />;
			case "maintenance": return <AlertCircle className="w-4 h-4" />;
			default: return <Info className="w-4 h-4" />;
		}
	};

	return (
		<div className="min-h-screen bg-background">

			<div className="container mx-auto px-4 py-8">
				<div className="grid lg:grid-cols-3 gap-8">
					{/* Main Content */}
					<div className="lg:col-span-2 space-y-6">
						{/* Equipment Image and Basic Info */}
						<Card className="overflow-hidden shadow-card">
							<div className="relative">
								{loading ? (
									<div className="w-full h-64 md:h-80 bg-muted animate-pulse" />
								) : (
									<img
										src={imageUrl}
										alt={equipment?.name}
										className="w-full h-64 md:h-80 object-cover"
										onError={(e) => {
											e.currentTarget.onerror = null;
											e.currentTarget.src = "/placeholder.svg";
										}}
									/>
								)}
								<div className="absolute top-4 left-4">
									<Badge className={`${getStatusColor(equipment?.status)} border`}>
										{getStatusIcon(equipment?.status)}
										<span className="ml-2 capitalize">{equipment?.status?.replace('-', ' ')}</span>
									</Badge>
								</div>
								<div className="absolute top-4 right-4">
									<Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
										{equipment?.category}
									</Badge>
								</div>
							</div>
              
							<CardHeader>
								<CardTitle className="text-2xl md:text-3xl">{equipment?.name || (loading ? "Loading..." : "")}</CardTitle>
								<CardDescription className="text-base leading-relaxed">
									{loading ? "" : equipment?.description}
								</CardDescription>
							</CardHeader>
						</Card>

						{/* Features */}
						<Card className="shadow-card">
							<CardHeader>
								<CardTitle className="flex items-center">
									<Settings className="w-5 h-5 mr-2 text-primary" />
									Key Features
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid md:grid-cols-2 gap-3">
									{(equipment?.features || []).map((feature) => (
										<div key={feature} className="flex items-center p-3 bg-muted/50 rounded-lg">
											<CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
											<span className="text-sm font-medium">{feature}</span>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Technical Specifications */}
						<Card className="shadow-card">
							<CardHeader>
								<CardTitle className="flex items-center">
									<Info className="w-5 h-5 mr-2 text-primary" />
									Technical Specifications
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-3">
									{Object.entries(equipment?.specifications || {}).map(([key, value]) => (
										<div key={key} className="flex justify-between items-center py-2 border-b border-border/50 last:border-b-0">
											<span className="font-medium text-foreground">{key}</span>
											<span className="text-muted-foreground text-right">{value}</span>
										</div>
									))}
								</div>
							</CardContent>
						</Card>

						{/* Usage Guidelines */}
						<Card className="shadow-card">
							<CardHeader>
								<CardTitle className="flex items-center">
									<Wrench className="w-5 h-5 mr-2 text-primary" />
									Usage Guidelines
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="space-y-2">
									{(equipment?.usageGuidelines || []).map((guideline, index) => (
										<li key={index} className="flex items-start">
											<div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
											<span className="text-sm leading-relaxed">{guideline}</span>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>

						{/* Safety Requirements */}
						<Card className="shadow-card border-amber-200 bg-amber-50/50">
							<CardHeader>
								<CardTitle className="flex items-center text-amber-800">
									<AlertCircle className="w-5 h-5 mr-2" />
									Safety Requirements
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="space-y-2">
									{(equipment?.safetyRequirements || []).map((requirement, index) => (
										<li key={index} className="flex items-start">
											<div className="w-2 h-2 bg-amber-600 rounded-full mt-2 mr-3 flex-shrink-0"></div>
											<span className="text-sm leading-relaxed text-amber-800">{requirement}</span>
										</li>
									))}
								</ul>
							</CardContent>
						</Card>
					</div>

					{/* Sidebar */}
					<div className="space-y-6 lg:sticky lg:top-24 self-start max-h-[calc(100vh-6rem)] overflow-auto pr-1">
						{/* Booking Card */}
						<Card className="shadow-card">
							<CardHeader>
								<CardTitle className="flex items-center">
									<Calendar className="w-5 h-5 mr-2 text-primary" />
									Book Equipment
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">Capacity</span>
										<div className="flex items-center text-sm text-muted-foreground">
											<Users className="w-4 h-4 mr-1" />
											{equipment?.capacity} user{(equipment?.capacity || 0) > 1 ? 's' : ''}
										</div>
									</div>
                  
									<div className="flex items-center justify-between">
										<span className="text-sm font-medium">Booking Units</span>
										<div className="flex items-center text-sm text-muted-foreground">
											<Clock className="w-4 h-4 mr-1" />
											{equipment?.bookingUnitMinutes} minutes
										</div>
									</div>
                  
									<Separator />
                  
									<div className="text-xs text-muted-foreground">
										{equipment?.maintenanceSchedule}
									</div>
								</div>
                
								<div className="space-y-2">
									<Button 
										variant={equipment?.status === "available" ? "hero" : "secondary"} 
										className="w-full"
										disabled={equipment?.status !== "available"}
										asChild={equipment?.status === "available"}
									>
										{equipment?.status === "available" ? (
											<Link to={`/equipment/${equipment?.id}/book`}>
												<Calendar className="w-4 h-4 mr-2" />
												Book Now
											</Link>
										) : (
											<>Currently Unavailable</>
										)}
									</Button>
                  
									<Button variant="outline" className="w-full" asChild>
										<Link to="/bookings">
											View All Bookings
										</Link>
									</Button>
								</div>
							</CardContent>
						</Card>

						{/* Quick Stats */}
						<Card className="shadow-card">
							<CardHeader>
								<CardTitle className="text-lg">Quick Stats</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="text-center">
									<div className="text-2xl font-bold text-primary mb-1">94%</div>
									<div className="text-xs text-muted-foreground uppercase tracking-wide">Uptime</div>
								</div>
								<Separator />
								<div className="text-center">
									<div className="text-2xl font-bold text-accent mb-1">156</div>
									<div className="text-xs text-muted-foreground uppercase tracking-wide">Hours This Month</div>
								</div>
								<Separator />
								<div className="text-center">
									<div className="text-2xl font-bold text-primary mb-1">23</div>
									<div className="text-xs text-muted-foreground uppercase tracking-wide">Active Users</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
};

export default EquipmentDetail;
