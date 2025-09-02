import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
	Search, 
	Filter, 
	Clock, 
	Users, 
	Settings, 
	Calendar,
	ArrowLeft,
	Wrench
} from "lucide-react";
import { EquipmentAPI } from "@/lib/api";

const Equipment = () => {
	const [searchTerm, setSearchTerm] = useState("");
	const [categoryFilter, setCategoryFilter] = useState("all");
	const [equipment, setEquipment] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				setLoading(true);
				const items = await EquipmentAPI.list();
				if (cancelled) return;
				const mapped = (items || []).map((e) => ({
					id: e._id,
					name: e.name,
					category: e.category,
					description: e.description || "",
					// Always point to image endpoint; fallback handled onError
					image: EquipmentAPI.imageUrl(e._id),
					capacity: e.capacity ?? 1,
					bookingUnitMinutes: e.bookingMinutes ?? 30,
					status: e.status === "maintenance" ? "maintenance" : "available",
					features: Array.isArray(e.keyFeatures) ? e.keyFeatures : [],
				}));
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
	}, []);

	const categories = useMemo(() => {
		const set = new Set(["all"]);
		equipment.forEach((e) => e.category && set.add(e.category));
		return Array.from(set);
	}, [equipment]);

	const filteredEquipment = equipment.filter(item => {
		const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
												 item.description.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
		return matchesSearch && matchesCategory;
	});

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
			case "available": return "🟢";
			case "in-use": return "🔵";
			case "maintenance": return "🟡";
			default: return "⚪";
		}
	};

	return (
		<div className="min-h-screen bg-background">

			<div className="container mx-auto px-4 py-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-foreground mb-2">Lab Equipment</h1>
					<p className="text-muted-foreground">
						Browse and book our fabrication equipment. All times shown are in minimum booking units.
					</p>
				</div>

				{/* Filters (only show when there is data) */}
				{equipment.length > 0 && (
					<div className="flex flex-col md:flex-row gap-4 mb-8 p-6 bg-card rounded-xl border border-border shadow-card">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
								<Input
									placeholder="Search equipment..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>
						<div className="w-full md:w-48">
							<Select value={categoryFilter} onValueChange={setCategoryFilter}>
								<SelectTrigger>
									<Filter className="w-4 h-4 mr-2" />
									<SelectValue placeholder="Category" />
								</SelectTrigger>
								<SelectContent>
									{categories.map(category => (
										<SelectItem key={category} value={category}>
											{category === "all" ? "All Categories" : category}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
				)}

				{/* Equipment Grid */}
				{error && (
					<div className="text-center text-red-600 mb-6">{error}</div>
				)}

				{loading ? (
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						{Array.from({ length: 6 }).map((_, i) => (
							<Card key={i} className="shadow-card animate-pulse h-80" />
						))}
					</div>
				) : (
				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
					{filteredEquipment.map((item) => (
						<Card key={item.id} className="group shadow-card hover:shadow-elegant transition-smooth overflow-hidden">
							<div className="relative">
								<img
									src={item.image}
									alt={item.name}
									className="w-full h-48 object-cover group-hover:scale-105 transition-smooth"
									onError={(e) => {
										e.currentTarget.onerror = null;
										e.currentTarget.src = "/placeholder.svg";
									}}
								/>
								<div className="absolute top-4 left-4">
									<Badge className={`${getStatusColor(item.status)} border`}>
										{getStatusIcon(item.status)} {item.status.replace('-', ' ')}
									</Badge>
								</div>
								<div className="absolute top-4 right-4">
									<Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
										{item.category}
									</Badge>
								</div>
							</div>
              
							<CardHeader>
								<CardTitle className="text-xl">{item.name}</CardTitle>
								<CardDescription className="text-sm leading-relaxed">
									{item.description}
								</CardDescription>
							</CardHeader>
              
							<CardContent className="space-y-4">
								<div className="flex flex-wrap gap-2">
									{item.features.slice(0, 3).map((feature) => (
										<Badge key={feature} variant="outline" className="text-xs">
											{feature}
										</Badge>
									))}
								</div>
                
								<div className="flex items-center justify-between text-sm text-muted-foreground">
									<div className="flex items-center">
										<Users className="w-4 h-4 mr-1" />
										Capacity: {item.capacity}
									</div>
									<div className="flex items-center">
										<Clock className="w-4 h-4 mr-1" />
										{item.bookingUnitMinutes}min slots
									</div>
								</div>
                
								<div className="flex gap-2 pt-2">
									<Button variant="equipment" size="sm" className="flex-1" asChild>
										<Link to={`/equipment/${item.id}`}>
											View Details
										</Link>
									</Button>
									<Button 
										variant={item.status === "available" ? "hero" : "secondary"} 
										size="sm" 
										className="flex-1"
										disabled={item.status !== "available"}
										asChild={item.status === "available"}
									>
										{item.status === "available" ? (
											<Link to={`/equipment/${item.id}/book`}>
												<Calendar className="w-4 h-4 mr-1" />
												Book Now
											</Link>
										) : (
											<>Unavailable</>
										)}
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
				)}

				{filteredEquipment.length === 0 && !loading && (
					<div className="text-center py-12 min-h-[50vh] flex flex-col items-center justify-center">
						<div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
							<Search className="w-8 h-8 text-primary-foreground" />
						</div>
						<h3 className="text-xl font-medium text-foreground mb-2">No equipment found</h3>
						<p className="text-muted-foreground">
							Try adjusting your search terms or category filter.
						</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default Equipment;
