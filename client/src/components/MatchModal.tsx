import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface User {
  id: number;
  name: string;
  age: number;
  image: string;
}

interface MatchModalProps {
  user: User;
  onClose: () => void;
}

const MatchModal = ({ user, onClose }: MatchModalProps) => {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-gradient-to-br from-primary to-accent z-40 flex flex-col items-center justify-center px-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="match-animation text-center mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-4xl font-bold text-white mb-2">It's a Match!</h2>
          <p className="text-white text-lg opacity-90">
            You and {user.name} liked each other!
          </p>
        </motion.div>
        
        <motion.div
          className="flex items-center justify-center space-x-4 mb-8"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Current user */}
          <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1488161628813-04466f872be2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200" 
              alt="Your profile" 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Matched user */}
          <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden">
            <img 
              src={user.image} 
              alt={`${user.name}'s profile`} 
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>
        
        <motion.div
          className="flex flex-col w-full max-w-xs gap-3"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Link href="/messages">
            <Button variant="default" className="bg-white text-primary hover:bg-white/90 hover:text-primary">
              Send a Message
            </Button>
          </Link>
          <Button variant="ghost" className="border border-white text-white hover:bg-white/10" onClick={onClose}>
            Keep Swiping
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MatchModal;
