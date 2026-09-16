import { motion } from 'framer-motion';

export const Preloader = () => {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
    >
      <div className="relative flex flex-col items-center gap-6">
        <div className="loader-orbit" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="text-center">
          <p className="font-display text-2xl font-bold tracking-normal">
            <span className="gradient-text">Varan Mamidala</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Loading portfolio</p>
        </div>
        <div className="loader-progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </motion.div>
  );
};
