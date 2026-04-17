import { CallToAction } from "@/components/landing/cta";
import { ExerciseTypes } from "@/components/landing/exercise-types";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { ForWhom } from "@/components/landing/for-whom";
import { Gamification } from "@/components/landing/gamification";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Navbar } from "@/components/landing/navbar";

export default function StorefrontPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-white text-gray-900">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <ExerciseTypes />
        <ForWhom />
        <Gamification />
        <FAQ />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
