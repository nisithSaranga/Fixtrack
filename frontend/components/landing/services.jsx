import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wrench, AlertTriangle, CreditCard, BarChart3, Users, Shield } from "lucide-react"

export function Services() {
  const services = [
    {
      icon: Wrench,
      title: "Vehicle Service Management",
      description: "Complete vehicle registration, service scheduling, and maintenance tracking system.",
    },
    {
      icon: AlertTriangle,
      title: "Emergency SOS",
      description: "Instant SMS alerts to certified mechanics for emergency roadside assistance.",
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Integrated Stripe payment processing for safe and convenient transactions.",
    },
    {
      icon: BarChart3,
      title: "Real-time Tracking",
      description: "Live updates on service progress with estimated completion times.",
    },
    {
      icon: Users,
      title: "Multi-role Platform",
      description: "Separate dashboards for clients, garages, and administrators.",
    },
    {
      icon: Shield,
      title: "Certified Mechanics",
      description: "All mechanics are verified, certified, and background-checked professionals.",
    },
  ]

  return (
    <section id="services" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive vehicle service management solutions designed for modern needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <service.icon className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">{service.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
