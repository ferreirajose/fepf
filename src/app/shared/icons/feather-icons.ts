// Exportação centralizada de ícones do Feather para uso em componentes standalone
import { FeatherModule } from 'angular-feather';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Tag,
  CreditCard,
  PieChart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Briefcase,
  Bell,
  User,
  Calendar,
  DollarSign,
  Plus,
  PlusCircle,
  Edit2,
  Trash2,
  Save,
  X,
  Check,
  ShoppingCart,
  Truck,
  Home,
  Search
} from 'angular-feather/icons';

// Lista completa de ícones usados na aplicação
export const icons = {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Tag,
  CreditCard,
  PieChart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Briefcase,
  Bell,
  User,
  Calendar,
  DollarSign,
  Plus,
  PlusCircle,
  Edit2,
  Trash2,
  Save,
  X,
  Check,
  ShoppingCart,
  Truck,
  Home,
  Search
};

// Módulo configurado para ser importado em componentes standalone
export const FeatherIconsModule = FeatherModule.pick(icons);
