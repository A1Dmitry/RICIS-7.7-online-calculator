import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export const REVIEWS_FILE = path.join(process.cwd(), 'reviews_db.json');
export const VISITORS_FILE = path.join(process.cwd(), 'visitors_db.json');
export const GEO_VISITORS_FILE = path.join(process.cwd(), 'geo_visitors_db.json');
export const APPLET_VISITS_FILE = path.join(process.cwd(), 'applet_visits_db.json');

export const AUTHOR_EMAIL = (process.env.AUTHOR_EMAIL || 'dima.aley@gmail.com').trim().toLowerCase();
export const INDEXNOW_KEY = 'e8d3c5f10b7a492c810d3e5f67a890bc';

export const SERVER_ACADEMIC_KEYWORDS = [
  { keyword: 'cern', name: 'CERN - European Organization for Nuclear Research', type: 'Research Center' },
  { keyword: 'mit', name: 'Massachusetts Institute of Technology (MIT)', type: 'University' },
  { keyword: 'stanford', name: 'Stanford University (SLAC / AI Lab)', type: 'University' },
  { keyword: 'harvard', name: 'Harvard University', type: 'University' },
  { keyword: 'msu', name: 'Московский Государственный Университет (МГУ им. М.В. Ломоносова)', type: 'University' },
  { keyword: 'lomonosov', name: 'МГУ им. М.В. Ломоносова (Суперкомпьютер СКИФ)', type: 'University' },
  { keyword: 'ras.ru', name: 'Российская Академия Наук (РАН)', type: 'Academy of Sciences' },
  { keyword: 'академия наук', name: 'Российская Академия Наук (РАН)', type: 'Academy of Sciences' },
  { keyword: 'миан', name: 'Математический институт им. В.А. Стеклова РАН (МИАН)', type: 'Research Center' },
  { keyword: 'фиан', name: 'Физический институт им. П.Н. Лебедева РАН (ФИАН)', type: 'Research Center' },
  { keyword: 'ипм', name: 'Институт прикладной математики им. М.В. Келдыша РАН', type: 'Research Center' },
  { keyword: 'eth', name: 'ETH Zürich (Swiss Federal Institute of Technology)', type: 'University' },
  { keyword: 'max planck', name: 'Max Planck Society for the Advancement of Science', type: 'Research Center' },
  { keyword: 'max-planck', name: 'Max Planck Institute for Mathematics & Physics', type: 'Research Center' },
  { keyword: 'cambridge', name: 'University of Cambridge (Cavendish Laboratory)', type: 'University' },
  { keyword: 'oxford', name: 'University of Oxford (Mathematical Institute)', type: 'University' },
  { keyword: 'caltech', name: 'California Institute of Technology (Caltech)', type: 'University' },
  { keyword: 'cnrs', name: 'CNRS - Centre National de la Recherche Scientifique', type: 'Research Center' },
  { keyword: 'inria', name: 'INRIA - National Institute for Research in Digital Science', type: 'Research Center' },
  { keyword: 'tokyo', name: 'University of Tokyo (Dept. of Mathematical Sciences)', type: 'University' },
  { keyword: 'geant', name: 'GÉANT Pan-European Research & Education Network', type: 'Research Center' },
  { keyword: 'internet2', name: 'Internet2 Higher Education & Research Network', type: 'University' },
  { keyword: 'runnet', name: 'Федеральная университетская сеть RUNNet', type: 'University' },
  { keyword: 'janet', name: 'JANET UK Education & Research Network', type: 'University' },
  { keyword: 'tsinghua', name: 'Tsinghua University (Institute for Advanced Study)', type: 'University' },
  { keyword: 'mipt', name: 'Московский Физико-Технический Институт (МФТИ / Физтех)', type: 'University' },
  { keyword: 'мехмат', name: 'Механико-математический факультет МГУ', type: 'University' },
  { keyword: 'spbu', name: 'Санкт-Петербургский Государственный Университет (СПбГУ)', type: 'University' },
  { keyword: 'nsu.ru', name: 'Новосибирский Государственный Университет (НГУ / СО РАН)', type: 'University' },
];
