import fs from 'fs';
import { GEO_VISITORS_FILE, SERVER_ACADEMIC_KEYWORDS } from '../config';

export function loadGeoVisitors(): any[] {
  try {
    if (fs.existsSync(GEO_VISITORS_FILE)) {
      const data = fs.readFileSync(GEO_VISITORS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading geo_visitors_db.json:', e);
  }
  return [];
}

export function saveGeoVisitors(visitors: any[]) {
  try {
    fs.writeFileSync(GEO_VISITORS_FILE, JSON.stringify(visitors, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing geo_visitors_db.json:', e);
  }
}

export function classifyInstitutionServer(isp: string, org: string) {
  const text = `${isp || ''} ${org || ''}`.toLowerCase();
  for (const item of SERVER_ACADEMIC_KEYWORDS) {
    if (text.includes(item.keyword.toLowerCase())) {
      return {
        isAcademic: true,
        name: item.name,
        type: item.type
      };
    }
  }
  if (
    text.includes('.edu') ||
    text.includes('.ac.') ||
    text.includes('university') ||
    text.includes('университет') ||
    text.includes('институт') ||
    text.includes('академия наук') ||
    text.includes('research center') ||
    text.includes('polytechnic') ||
    text.includes('college')
  ) {
    const rawName = org || isp;
    return {
      isAcademic: true,
      name: rawName && rawName.length > 3 ? rawName : 'Educational & Scientific Institute',
      type: 'University'
    };
  }
  return { isAcademic: false };
}
