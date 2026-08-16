import { Subject } from '../types/attendance.types';
import { 
  Laptop, BarChart3, Calculator, BookOpen, FlaskConical, Code, PenTool, Globe, 
  Briefcase, HelpCircle, Megaphone, Atom, Dna, Leaf, Wrench, Cpu, Database, 
  Palette, Music, Camera, Film, Languages, Users, Scale, Brain, HeartPulse, 
  Dumbbell, DraftingCompass, ChefHat, Utensils, Car, Plane, Type, Network, 
  TrendingUp, Activity, Stethoscope, Sprout, IndianRupee
} from 'lucide-react-native';

export const getSubjectIcon = (name: string) => {
  const lowerName = name.toLowerCase();

  // Languages & Literature
  if (lowerName.includes('english') || lowerName.includes('hindi') || lowerName.includes('spanish') || lowerName.includes('french') || lowerName.includes('german') || lowerName.includes('language') || lowerName.includes('linguist')) return Languages;
  if (lowerName.includes('read') || lowerName.includes('lit') || lowerName.includes('book') || lowerName.includes('poetry') || lowerName.includes('writing') || lowerName.includes('grammar')) return BookOpen;

  // Mathematics
  if (lowerName.includes('math') || lowerName.includes('calc') || lowerName.includes('algebra') || lowerName.includes('geometry') || lowerName.includes('trig') || lowerName.includes('prob') || lowerName.includes('stat')) return Calculator;

  // Computer Science & IT
  if (lowerName.includes('program') || lowerName.includes('code') || lowerName.includes('algo') || lowerName.includes('python') || lowerName.includes('java') || lowerName.includes('c++') || lowerName.includes('web')) return Code;
  if (lowerName.includes('data') || lowerName.includes('sql') || lowerName.includes('dbms') || lowerName.includes('database')) return Database;
  if (lowerName.includes('network') || lowerName.includes('cloud') || lowerName.includes('cyber') || lowerName.includes('security')) return Network;
  if (lowerName.includes('computer') || lowerName.includes('software') || lowerName.includes('system') || lowerName.includes('technology') || lowerName.includes('tech') || lowerName.includes('it')) return Laptop;
  if (lowerName.includes('ai') || lowerName.includes('machine learning') || lowerName.includes('hardware') || lowerName.includes('micro')) return Cpu;

  // Sciences
  if (lowerName.includes('phys')) return Atom;
  if (lowerName.includes('bio') || lowerName.includes('genet') || lowerName.includes('zoo') || lowerName.includes('botan')) return Dna;
  if (lowerName.includes('chem') || lowerName.includes('science')) return FlaskConical;
  if (lowerName.includes('env') || lowerName.includes('earth') || lowerName.includes('eco') || lowerName.includes('agri')) return Leaf;
  if (lowerName.includes('plant') || lowerName.includes('farm') || lowerName.includes('crop')) return Sprout;

  // Business & Management
  if (lowerName.includes('finance') || lowerName.includes('account') || lowerName.includes('tax') || lowerName.includes('audit')) return IndianRupee;
  if (lowerName.includes('market') || lowerName.includes('consumer') || lowerName.includes('brand') || lowerName.includes('sales')) return Megaphone;
  if (lowerName.includes('econ') || lowerName.includes('invest') || lowerName.includes('stock')) return TrendingUp;
  if (lowerName.includes('business') || lowerName.includes('manage') || lowerName.includes('commerce') || lowerName.includes('hr') || lowerName.includes('admin') || lowerName.includes('entrepreneur')) return Briefcase;

  // Arts & Design
  if (lowerName.includes('art') || lowerName.includes('paint') || lowerName.includes('color') || lowerName.includes('draw')) return Palette;
  if (lowerName.includes('design') || lowerName.includes('graphic') || lowerName.includes('ui/ux') || lowerName.includes('visual')) return PenTool;
  if (lowerName.includes('music') || lowerName.includes('audio') || lowerName.includes('sound') || lowerName.includes('choir') || lowerName.includes('band')) return Music;
  if (lowerName.includes('photo') || lowerName.includes('camera') || lowerName.includes('video')) return Camera;
  if (lowerName.includes('film') || lowerName.includes('cinema') || lowerName.includes('theat') || lowerName.includes('act')) return Film;

  // Social Sciences & Humanities
  if (lowerName.includes('history') || lowerName.includes('geo') || lowerName.includes('world') || lowerName.includes('culture') || lowerName.includes('anthro')) return Globe;
  if (lowerName.includes('socio') || lowerName.includes('politi') || lowerName.includes('govern') || lowerName.includes('civic') || lowerName.includes('human')) return Users;
  if (lowerName.includes('law') || lowerName.includes('legal') || lowerName.includes('justice') || lowerName.includes('ethic')) return Scale;
  if (lowerName.includes('psych') || lowerName.includes('mind') || lowerName.includes('philosophy') || lowerName.includes('logic')) return Brain;

  // Medicine & Health
  if (lowerName.includes('med') || lowerName.includes('health') || lowerName.includes('nurs') || lowerName.includes('clinic') || lowerName.includes('pharm')) return HeartPulse;
  if (lowerName.includes('anatom') || lowerName.includes('physiol') || lowerName.includes('surg') || lowerName.includes('dent')) return Stethoscope;

  // Engineering & Architecture
  if (lowerName.includes('engin') || lowerName.includes('mech') || lowerName.includes('civil') || lowerName.includes('elec') || lowerName.includes('robot')) return Wrench;
  if (lowerName.includes('arch') || lowerName.includes('draft') || lowerName.includes('cad') || lowerName.includes('construct')) return DraftingCompass;

  // Physical Education & Sports
  if (lowerName.includes('pe') || lowerName.includes('phys ed') || lowerName.includes('sport') || lowerName.includes('fit') || lowerName.includes('gym')) return Dumbbell;
  if (lowerName.includes('kines') || lowerName.includes('movement')) return Activity;

  // Culinary & Hospitality
  if (lowerName.includes('culin') || lowerName.includes('cook') || lowerName.includes('bake') || lowerName.includes('chef') || lowerName.includes('food')) return ChefHat;
  if (lowerName.includes('hospitality') || lowerName.includes('hotel') || lowerName.includes('tourism') || lowerName.includes('cater')) return Utensils;

  // Vocational & Technical
  if (lowerName.includes('auto') || lowerName.includes('car') || lowerName.includes('vehicle')) return Car;
  if (lowerName.includes('avia') || lowerName.includes('aero') || lowerName.includes('flight') || lowerName.includes('plane')) return Plane;

  // Fallback for general stats/analysis if nothing else matches
  if (lowerName.includes('analysis')) return BarChart3;
  if (lowerName.includes('type') || lowerName.includes('word')) return Type;

  return HelpCircle; // Default fallback icon
};

export const isMarkedOnDate = (subject: Subject, date: string, periodIndex?: number): boolean => {
  return subject.history.some((snapshot) => {
    const dateMatch = snapshot.date === date;
    if (periodIndex !== undefined) {
      return dateMatch && snapshot.periodIndex === periodIndex;
    }
    return dateMatch;
  });
};
