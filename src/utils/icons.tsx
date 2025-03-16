// Import only the specific icons we need
import {
  ArrowLeft,
  Star,
  Play,
  Search,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  Maximize,
  Minimize,
  Loader2,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowUpRight,
  Clock,
  Building2,
  Menu,
  Telescope,
  MessageSquare,
  Home,
  Languages,
  ArrowDown,
  Calendar,
  Handshake,
  Contact,
  MessageCircle,
  Users,
  ExternalLink,
  ArrowUpDown,
  ThumbsUp
} from 'lucide-react';

// Create an icons object to easily reference all icons
export const Icons = {
  ArrowLeft,
  Star,
  Play,
  Search,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Info,
  X,
  Maximize,
  Minimize,
  Loader2,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowUpRight,
  Clock,
  Building2,
  Menu,
  Telescope,
  MessageSquare,
  Home,
  Languages,
  ArrowDown,
  Calendar,
  Handshake,
  Contact,
  MessageCircle,
  Users,
  ExternalLink,
  ArrowUpDown,
  ThumbsUp
};

// Export a type for the icon names
export type IconName = keyof typeof Icons;

// Component to render an icon by name
export const Icon = ({ 
  name, 
  size = 24, 
  color = 'currentColor',
  className = '',
  ...props 
}: {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
  [key: string]: any;
}) => {
  const IconComponent = Icons[name];
  return <IconComponent size={size} color={color} className={className} {...props} />;
};
