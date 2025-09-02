import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Calendar, Users, Zap, ChevronRight, Play } from "lucide-react";
import heroPrinter from "@/assets/3d-printer-hero.jpg";
import { useToast } from "@/hooks/use-toast";
import { getToken, getUser } from "@/lib/api";

const Index = () => {
	const features = [
		{
			icon: Calendar,
			title: "Smart Booking System",
			description: "Reserve equipment with intelligent scheduling and availability checking",
			color: "text-primary"
		},
		{
			icon: Wrench,
			title: "Equipment Management",
			description: "Track maintenance, usage, and specifications for all lab equipment",
			color: "text-accent"
		},
		{
			icon: Users,
			title: "User-Friendly Interface",
			description: "Intuitive design for makers, students, and lab administrators",
			color: "text-primary"
		},
		{
			icon: Zap,
			title: "Real-Time Updates",
			description: "Live status updates and instant notifications for your bookings",
			color: "text-accent"
		}
	];

	const stats = [
		{ label: "Active Equipment", value: "15+" },
		{ label: "Monthly Bookings", value: "200+" },
		{ label: "Lab Members", value: "50+" },
		{ label: "Success Rate", value: "99%" }
	];

		const navigate = useNavigate();
		const { toast } = useToast();

		const handleAdminClick = () => {
			const token = getToken();
			const user = getUser();
			if (token && user?.role === "admin") {
				navigate("/admin-dashboard");
				return;
			}
			if (token && user) {
				toast({ title: "Restricted", description: "Admin access only.", variant: "destructive" });
				return;
			}
			toast({ title: "Sign in required", description: "Please log in to access the admin dashboard." });
			navigate("/login", { state: { from: "/admin-dashboard", intent: "admin" } });
		};

		return (
		<div className="min-h-screen bg-background">

			<section className="relative py-20 overflow-hidden">
				<div className="absolute inset-0 gradient-hero opacity-95"></div>
				<div className="container mx-auto px-4 relative z-10">
					<div className="grid lg:grid-cols-2 gap-12 items-center">
						<div className="space-y-8 animate-fade-in">
							<div className="space-y-4">
								<Badge variant="secondary" className="w-fit">
									<Zap className="w-3 h-3 mr-1" />
									Modern FabLab Management
								</Badge>
								<h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
									Smart Equipment
									<span className="gradient-accent bg-clip-text text-transparent"> Booking</span>
									<br />
									Made Simple
								</h1>
								<p className="text-xl text-white/80 leading-relaxed max-w-lg">
									Streamline your fabrication lab with intelligent equipment scheduling, 
									real-time availability, and comprehensive management tools.
								</p>
							</div>
              
							<div className="flex flex-col sm:flex-row gap-4">
								<Button variant="hero" size="lg" asChild>
									<Link to="/equipment">
										<Play className="w-4 h-4 mr-2" />
										View Equipment
									</Link>
								</Button>
								<Button variant="accent" size="lg" asChild>
									<Link to="/bookings">
										<Calendar className="w-4 h-4 mr-2" />
										Book Now
									</Link>
								</Button>
							</div>

							<div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
								{stats.map((stat) => (
									<div key={stat.label} className="text-center">
										<div className="text-2xl md:text-3xl font-bold text-white mb-1">
											{stat.value}
										</div>
										<div className="text-sm text-white/60 uppercase tracking-wide">
											{stat.label}
										</div>
									</div>
								))}
							</div>
						</div>

						<div className="relative animate-scale-in flex justify-center">
							<div className="relative rounded-2xl overflow-hidden shadow-elegant">
								<img 
									src={heroPrinter} 
									alt="Modern 3D Printer in FabLab"
									className="h-[500px] object-cover mx-auto block"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
							</div>
							<div className="absolute -top-4 -right-4 w-24 h-24 gradient-primary rounded-full animate-glow opacity-20"></div>
							<div className="absolute -bottom-6 -left-6 w-16 h-16 gradient-accent rounded-full animate-glow opacity-30"></div>
						</div>
					</div>
				</div>
			</section>

			<section className="py-20 bg-muted/30">
				<div className="container mx-auto px-4">
					<div className="text-center mb-16">
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
							Everything You Need to Manage Your FabLab
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							From equipment booking to maintenance tracking, our comprehensive platform 
							handles all aspects of modern fabrication lab management.
						</p>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
						{features.map((feature) => (
							<Card key={feature.title} className="shadow-card hover:shadow-elegant transition-smooth group cursor-pointer">
								<CardHeader className="text-center pb-4">
									<div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-bounce`}>
										<feature.icon className={`w-6 h-6 ${feature.color}`} />
									</div>
									<CardTitle className="text-lg">{feature.title}</CardTitle>
								</CardHeader>
								<CardContent>
									<CardDescription className="text-center leading-relaxed">
										{feature.description}
									</CardDescription>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>

			<section className="py-20 gradient-hero relative overflow-hidden">
				<div className="container mx-auto px-4 text-center relative z-10">
					<div className="max-w-3xl mx-auto space-y-8">
						<h2 className="text-3xl md:text-4xl font-bold text-white">
							Ready to Transform Your FabLab?
						</h2>
						<p className="text-xl text-white/80">
							Join modern fabrication labs worldwide using our platform to streamline 
							operations and enhance the maker experience.
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Button variant="hero" size="lg" asChild>
								<Link to="/equipment">
									Explore Equipment
									<ChevronRight className="w-4 h-4 ml-1" />
								</Link>
							</Button>
							<Button
								variant="outline"
								size="lg"
								onClick={handleAdminClick}
								className="bg-white/10 border-white/20 text-white hover:bg-white/20"
							>
								Admin Dashboard
							</Button>
						</div>
					</div>
				</div>
				<div className="absolute top-0 right-0 w-96 h-96 gradient-primary rounded-full blur-3xl opacity-10"></div>
				<div className="absolute bottom-0 left-0 w-64 h-64 gradient-accent rounded-full blur-3xl opacity-10"></div>
			</section>

			<footer className="border-t border-border bg-card py-12">
				<div className="container mx-auto px-4">
					<div className="flex flex-col md:flex-row justify-between items-center">
						<div className="flex items-center space-x-2 mb-4 md:mb-0">
							<div className="w-6 h-6 gradient-primary rounded flex items-center justify-center">
								<Wrench className="w-4 h-4 text-primary-foreground" />
							</div>
							<span className="font-semibold text-foreground">FabLab Manager</span>
						</div>
						<div className="text-sm text-muted-foreground">
							© 2024 FabLab Manager. Built for modern maker spaces.
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
};

export default Index;
