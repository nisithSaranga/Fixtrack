import { CheckCircle } from "lucide-react"

export function About() {
  const features = [
    "Instant mechanic connection",
    "Real-time service tracking",
    "Secure payment processing",
    "Emergency SOS alerts",
    "Certified professionals only",
    "Mobile-first experience",
  ]

  return (
    <section id="about" className="py-16 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">About FixTrack</h2>
            <p className="text-lg text-gray-600 mb-6">
              FixTrack revolutionizes vehicle service management by connecting vehicle owners with certified mechanics
              through our advanced platform. We provide real-time tracking, emergency assistance, and seamless payment
              processing.
            </p>
            <p className="text-lg text-gray-600 mb-8">
              Our mission is to make vehicle maintenance stress-free, transparent, and accessible to everyone, anywhere,
              anytime.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-r from-primary to-blue-600 rounded-lg p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">Why Choose FixTrack?</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Trusted by 10,000+ vehicle owners</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>500+ certified mechanics nationwide</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>Average response time: 15 minutes</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span>99.9% customer satisfaction rate</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
