import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Utensils, 
  Users, 
  Calendar, 
  Award, 
  Clock, 
  ThumbsUp, 
  Phone, 
  Mail, 
  MapPin,
  Leaf,
  Drumstick,
  Building2,
  Heart
} from "lucide-react";
import foodieLogo from "@/assets/foodie-logo.png";
import heroCatering from "@/assets/hero-catering.jpg";

const Homepage = () => {
  const services = [
    {
      icon: Leaf,
      title: "Veg Catering",
      description: "Fresh, flavorful vegetarian dishes crafted with the finest ingredients for every occasion.",
      color: "text-green-600"
    },
    {
      icon: Drumstick,
      title: "Non-Veg Catering",
      description: "Succulent meat and seafood preparations that delight your taste buds.",
      color: "text-red-500"
    },
    {
      icon: Building2,
      title: "Corporate Events",
      description: "Professional catering solutions for meetings, conferences, and office celebrations.",
      color: "text-blue-600"
    },
    {
      icon: Heart,
      title: "Wedding Catering",
      description: "Make your special day memorable with our exquisite wedding menu packages.",
      color: "text-pink-500"
    }
  ];

  const whyChooseUs = [
    {
      icon: Award,
      title: "Premium Quality",
      description: "Only the freshest ingredients and highest quality standards"
    },
    {
      icon: Clock,
      title: "On-Time Delivery",
      description: "We ensure punctual service for every event, every time"
    },
    {
      icon: Users,
      title: "Expert Team",
      description: "Experienced chefs and professional service staff"
    },
    {
      icon: ThumbsUp,
      title: "100% Satisfaction",
      description: "Thousands of happy customers and counting"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src={foodieLogo} alt="Foodie" className="h-10 w-auto" />
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-foreground font-medium hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/book" className="text-muted-foreground hover:text-primary transition-colors">
                Menu
              </Link>
              <Link to="/book" className="text-muted-foreground hover:text-primary transition-colors">
                Catering Date
              </Link>
              <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">
                Contact
              </a>
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
            </div>

            <div className="md:hidden">
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-16">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroCatering})` }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Delicious Catering for Every Occasion
          </h1>
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            From intimate gatherings to grand celebrations, we bring exceptional flavors and impeccable service to your events.
          </p>
          <Link to="/book">
            <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90">
              <Calendar className="mr-2 h-5 w-5" />
              Book Catering
            </Button>
          </Link>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Services
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We offer a wide range of catering services tailored to meet your specific needs and preferences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card">
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex p-4 rounded-full bg-muted mb-4 group-hover:scale-110 transition-transform`}>
                    <service.icon className={`h-8 w-8 ${service.color}`} />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose Us
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Experience the difference with Foodie Catering - where quality meets excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUs.map((item, index) => (
              <div key={index} className="text-center group">
                <div className="inline-flex p-5 rounded-full bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Plan Your Event?
          </h2>
          <p className="text-primary-foreground/90 text-lg mb-8">
            Let us make your next event unforgettable with our delicious food and exceptional service.
          </p>
          <Link to="/book">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              <Utensils className="mr-2 h-5 w-5" />
              Start Booking Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-card border-t border-border py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={foodieLogo} alt="Foodie" className="h-10 w-auto" />
              </div>
              <p className="text-muted-foreground text-sm">
                Premium catering services for all your special occasions. Quality food, exceptional service.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/book" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                    Book Catering
                  </Link>
                </li>
                <li>
                  <Link to="/auth" className="text-muted-foreground hover:text-primary text-sm transition-colors">
                    Admin Login
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="font-semibold text-foreground mb-4">Contact Us</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-muted-foreground text-sm">
                  <Phone className="h-4 w-4 text-primary" />
                  +91 98765 43210
                </li>
                <li className="flex items-center gap-3 text-muted-foreground text-sm">
                  <Mail className="h-4 w-4 text-primary" />
                  info@foodiecatering.com
                </li>
                <li className="flex items-start gap-3 text-muted-foreground text-sm">
                  <MapPin className="h-4 w-4 text-primary mt-0.5" />
                  123 Catering Street, Food City, India
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} Foodie Catering. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
