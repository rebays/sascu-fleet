import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Info,
  HelpCircle,
  CheckCircle,
  Car,
  Shield,
  Headphones,
  DollarSign,
  Users,
  Award,
  TrendingUp,
  Zap,
  Heart,
  Target,
  ArrowRight,
} from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";

export default function AboutPage() {
  return (
    <div className="-mt-[108px] md:-mt-[88px]">
      {/* Hero Section */}
      <section className="relative bg-linear-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 md:px-8 pt-36 md:pt-24 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Our Story
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From humble beginnings to becoming your trusted mobility partner
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 md:px-8 py-16">
        {/* Breadcrumb */}
        <div className="mb-12">
          <Breadcrumb items={[{ label: "About" }]} />
        </div>

        {/* Our Story */}
        <div className="mb-20">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Our Mission</h3>
                  <p className="text-muted-foreground">
                    To make vehicle rental simple, affordable, and accessible to
                    everyone. We provide a diverse fleet that meets the needs of
                    both individual and business customers.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Our Values</h3>
                  <p className="text-muted-foreground">
                    Integrity, reliability, and customer satisfaction drive
                    everything we do. We're committed to transparency, quality
                    service, and building lasting relationships.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl p-8 border border-primary/20">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Award className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Industry Recognition</h4>
                    <p className="text-sm text-muted-foreground">
                      Awarded Best Fleet Service 2023
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Customer First</h4>
                    <p className="text-sm text-muted-foreground">
                      5,000+ satisfied customers and counting
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">Growing Fleet</h4>
                    <p className="text-sm text-muted-foreground">
                      Continuously expanding our vehicle selection
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information - Improved Layout */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Get In Touch</h2>
            <p className="text-muted-foreground">
              We&apos;re here to help with all your rental needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="font-bold">Main Office</h3>
              </div>
              <p className="text-sm text-muted-foreground">Solomon Airlines Credit Union</p>
              <p className="text-sm text-muted-foreground">Henderson</p>
              <p className="text-sm text-muted-foreground">Honiara, Solomon Islands</p>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <Phone className="h-5 w-5 text-primary" />
                <h3 className="font-bold">Phone</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                General: (555) 123-4567
              </p>
              <p className="text-sm text-muted-foreground mb-1">
                Bookings: (555) 123-4568
              </p>
              <p className="text-sm text-muted-foreground">
                Support: (555) 123-4569
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="h-5 w-5 text-primary" />
                <h3 className="font-bold">Email</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                info@sascufleet.com
              </p>
              <p className="text-sm text-muted-foreground mb-1">
                bookings@sascufleet.com
              </p>
              <p className="text-sm text-muted-foreground">
                support@sascufleet.com
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-bold">Hours</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                Mon-Fri: 8AM - 6PM
              </p>
              <p className="text-sm text-muted-foreground mb-1">
                Sat: 9AM - 5PM
              </p>
              <p className="text-sm text-muted-foreground">Sun: 10AM - 4PM</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-8">
          <h3 className="text-2xl font-bold mb-3">Ready to Get Started?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Browse our fleet and book your perfect vehicle today
          </p>
          <Link
            href="/vehicles"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Browse Vehicles
          </Link>
        </div>
      </section>
    </div>
  );
}
