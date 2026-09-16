import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Mail, MapPin, Linkedin, Github, Send, MessageSquare, Phone } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const Contact = () => {
  const ref = useRef(null);
  const formRef = useRef<HTMLFormElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    setIsSubmitting(true);

    const formData = new FormData(formRef.current);
    const name = String(formData.get('from_name') || '');
    const email = String(formData.get('from_email') || '');
    const subject = String(formData.get('subject') || 'Portfolio contact');
    const message = String(formData.get('message') || '');
    const body = encodeURIComponent(`${message}\n\nFrom: ${name}\nEmail: ${email}`);

    window.location.href = `mailto:varan4636@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;
    toast({
      title: 'Email draft opened',
      description: 'Your message is ready to send through your email app.',
    });
    formRef.current.reset();
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      value: 'varan4636@gmail.com',
      href: 'mailto:varan4636@gmail.com',
      description: 'Best way to reach me for opportunities'
    },
    {
      icon: Linkedin,
      title: 'LinkedIn',
      value: 'linkedin.com/in/varan-mamidala',
      href: 'https://www.linkedin.com/in/varan-mamidala-2b950b261/',
      description: 'Let\'s connect professionally'
    },
    {
      icon: Github,
      title: 'GitHub',
      value: 'github.com/varan0209',
      href: 'https://github.com/varan0209',
      description: 'Explore my code and projects'
    },
    {
      icon: MapPin,
      title: 'Location',
      value: 'Hyderabad, Telangana, India',
      href: null,
      description: 'Open to full-time Data Analyst and Software Engineer opportunities'
    },
    {
      icon: Phone,
      title: 'Phone',
      value: '+91 9398626446',
      href: 'tel:+919398626446',
      description: 'Available for recruiter calls and technical discussions'
    }
  ];

  const reasons = [
    'Full-time Data Analyst and Software Engineer opportunities',
    'SQL analytics, Power BI dashboards, and business intelligence projects',
    'Python automation, NLP summarization, and ML modeling projects',
    'Full-stack web application development and API integration roles',
  ];

  return (
    <section id="contact" className="py-24 relative bg-secondary/20" ref={ref}>
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="inline-block glass-card px-4 py-2 mb-4">
            <span className="text-sm text-primary font-medium">Contact</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
            Let's <span className="gradient-text">Connect</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            I am open to opportunities where software, data, and AI work together to solve real problems.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-8"
          >
            <div className="glass-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <MessageSquare className="text-primary" size={28} />
                <h3 className="font-display text-2xl font-bold">Contact Information</h3>
              </div>
              
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <motion.div
                    key={info.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.1 * index + 0.4 }}
                    className="group"
                  >
                    {info.href ? (
                      <a
                        href={info.href}
                        target={info.href.startsWith('http') ? '_blank' : undefined}
                        rel={info.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="flex items-start gap-4 p-4 rounded-xl hover:bg-secondary/30 transition-all duration-300 group-hover:translate-x-2"
                      >
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors shrink-0">
                          <info.icon size={20} className="text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">{info.title}</h4>
                          <p className="text-primary font-medium mb-1">{info.value}</p>
                          <p className="text-sm text-muted-foreground">{info.description}</p>
                        </div>
                      </a>
                    ) : (
                      <div className="flex items-start gap-4 p-4 rounded-xl">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <info.icon size={20} className="text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">{info.title}</h4>
                          <p className="text-primary font-medium mb-1">{info.value}</p>
                          <p className="text-sm text-muted-foreground">{info.description}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

          </motion.div>

          {/* Contact form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <form ref={formRef} onSubmit={sendEmail} className="glass-card p-8 space-y-6">
              <div>
                <h3 className="font-display text-2xl font-bold mb-2">Send a Message</h3>
                <p className="text-muted-foreground">
                  Have a role, referral, project, or technical conversation in mind? I'd love to hear from you.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="from_name" className="block text-sm font-medium mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="from_name"
                    name="from_name"
                    required
                    className="w-full px-4 py-3 bg-secondary/30 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="from_email" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="from_email"
                    name="from_email"
                    required
                    className="w-full px-4 py-3 bg-secondary/30 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  className="w-full px-4 py-3 bg-secondary/30 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  className="w-full px-4 py-3 bg-secondary/30 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={18} />
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>

              <p className="text-xs text-muted-foreground text-center">
                Or email me directly at <span className="text-primary">varan4636@gmail.com</span>
              </p>
            </form>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="glass-card mt-10 p-8"
        >
          <h3 className="font-display text-xl font-bold mb-5">Why Reach Out?</h3>
          <div className="grid gap-4 md:grid-cols-4">
            {reasons.map((reason) => (
              <div key={reason} className="border-l border-primary/35 pl-4 text-sm leading-relaxed text-muted-foreground">
                {reason}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
