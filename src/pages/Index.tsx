import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { About } from '@/components/About';
import { Skills } from '@/components/Skills';
import { Projects } from '@/components/Projects';
import { Experience } from '@/components/Experience';
import { ResumePreview } from '@/components/ResumePreview';
import { Education } from '@/components/Education';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { InteractiveBackground } from '@/components/InteractiveBackground';
import { Preloader } from '@/components/Preloader';
import { Growth } from '@/components/Growth';
import { Credibility } from '@/components/Credibility';
import { AskTaranAI } from '@/components/AskTaranAI';
import { useEffect, useState } from 'react';
import { flushResumeAnalytics, initAnalytics, trackEvent } from '@/lib/analytics';

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = 'Varan Mamidala | Data Analyst & Software Engineer';
    initAnalytics();
    trackEvent({ action: 'page_view', label: 'portfolio_home' });
    void flushResumeAnalytics();

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content',
        'Portfolio of Varan Mamidala - Data Analyst and Software Engineer based in Hyderabad, India. Focused on Python, SQL, Power BI, Tableau, Machine Learning, NLP, and Full Stack Web Development.'
      );
    }

    const minimumLoad = window.setTimeout(() => setIsLoading(false), 1250);
    const finishLoad = () => {
      window.setTimeout(() => setIsLoading(false), 450);
    };

    if (document.readyState === 'complete') {
      finishLoad();
    } else {
      window.addEventListener('load', finishLoad, { once: true });
    }

    return () => {
      window.clearTimeout(minimumLoad);
      window.removeEventListener('load', finishLoad);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <InteractiveBackground />
      {isLoading && <Preloader />}
      <div className="relative z-10">
        <Navbar />
        <main>
          <Hero />
          <About />
          <Skills />
          <Projects />
          <Experience />
          <ResumePreview />
          <Education />
          <Credibility />
          <Growth />
          <Contact />
        </main>
        <AskTaranAI />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
