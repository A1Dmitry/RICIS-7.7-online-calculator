/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GeoVisitorRecord {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  isp: string;
  org: string;
  isAcademicOrScientific: boolean;
  institutionName?: string;
  institutionType?: 'University' | 'Research Center' | 'National Lab' | 'Academy of Sciences';
  totalVisits: number;
  uniqueVisitors: number;
  topAppletUsed: string;
  lastVisited: string;
}

// Academic keywords for client-side evaluation helper
const ACADEMIC_KEYWORDS = [
  { keyword: 'cern', name: 'CERN - European Organization for Nuclear Research', type: 'Research Center' },
  { keyword: 'mit', name: 'Massachusetts Institute of Technology (MIT)', type: 'University' },
  { keyword: 'stanford', name: 'Stanford University (SLAC / AI Lab)', type: 'University' },
  { keyword: 'harvard', name: 'Harvard University', type: 'University' },
  { keyword: 'msu', name: 'Московский Государственный Университет (МГУ)', type: 'University' },
  { keyword: 'lomonosov', name: 'МГУ им. М.В. Ломоносова (Суперкомпьютер СКИФ)', type: 'University' },
  { keyword: 'ras.ru', name: 'Российская Академия Наук (РАН)', type: 'Academy of Sciences' },
  { keyword: 'миан', name: 'Математический институт им. В.А. Стеклова РАН (МИАН)', type: 'Research Center' },
  { keyword: 'фиан', name: 'Физический институт им. П.Н. Лебедева РАН (ФИАН)', type: 'Research Center' },
  { keyword: 'ипм', name: 'Институт прикладной математики им. М.В. Келдыша РАН', type: 'Research Center' },
  { keyword: 'eth', name: 'ETH Zürich (Swiss Federal Institute of Technology)', type: 'University' },
  { keyword: 'max planck', name: 'Max Planck Society for the Advancement of Science', type: 'Research Center' },
  { keyword: 'cambridge', name: 'University of Cambridge (Cavendish Laboratory)', type: 'University' },
  { keyword: 'oxford', name: 'University of Oxford (Mathematical Institute)', type: 'University' },
  { keyword: 'caltech', name: 'California Institute of Technology (Caltech)', type: 'University' },
  { keyword: 'cnrs', name: 'CNRS - Centre National de la Recherche Scientifique', type: 'Research Center' },
  { keyword: 'tokyo', name: 'University of Tokyo (Dept. of Mathematical Sciences)', type: 'University' },
  { keyword: 'mipt', name: 'Московский Физико-Технический Институт (МФТИ)', type: 'University' },
  { keyword: 'spbu', name: 'Санкт-Петербургский Государственный Университет (СПбГУ)', type: 'University' },
  { keyword: 'nsu.ru', name: 'Новосибирский Государственный Университет (НГУ / СО РАН)', type: 'University' },
];

export function classifyInstitution(isp: string, org: string, domain?: string): {
  isAcademic: boolean;
  name?: string;
  type?: 'University' | 'Research Center' | 'National Lab' | 'Academy of Sciences';
} {
  const text = `${isp || ''} ${org || ''} ${domain || ''}`.toLowerCase();

  for (const item of ACADEMIC_KEYWORDS) {
    if (text.includes(item.keyword.toLowerCase())) {
      return {
        isAcademic: true,
        name: item.name,
        type: item.type as any
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

/**
 * Fetch live global GEO visitor records from the server database.
 * No hardcoded or fake static lists!
 */
export async function fetchGlobalGeoVisitors(): Promise<{
  records: GeoVisitorRecord[];
  totalVisitsCount: number;
  academicVisitsCount: number;
  academicInstitutionsCount: number;
}> {
  try {
    const res = await fetch('/api/geo-visitors');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.records)) {
        return {
          records: data.records,
          totalVisitsCount: data.totalVisitsCount || 0,
          academicVisitsCount: data.academicVisitsCount || 0,
          academicInstitutionsCount: data.academicInstitutionsCount || 0
        };
      }
    }
  } catch (e) {
    console.error('Error fetching global GEO visitors from server:', e);
  }
  return {
    records: [],
    totalVisitsCount: 0,
    academicVisitsCount: 0,
    academicInstitutionsCount: 0
  };
}

/**
 * Register a real client session visit in the server database.
 */
export async function recordClientGeoVisit(appletName?: string): Promise<{
  currentRecord: GeoVisitorRecord | null;
  records: GeoVisitorRecord[];
}> {
  let geoDetails: any = {};

  // Try optional browser IP lookup to enrich ISP / city / country if available
  try {
    const ipRes = await fetch('https://ipapi.co/json/', { mode: 'cors' });
    if (ipRes.ok) {
      const data = await ipRes.json();
      geoDetails = {
        country: data.country_name,
        countryCode: data.country_code,
        region: data.region,
        city: data.city,
        isp: data.org || data.asn,
        org: data.org || data.isp
      };
    }
  } catch (e) {
    // If client IP API is blocked, server will resolve IP address from HTTP headers automatically
  }

  try {
    const res = await fetch('/api/geo-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...geoDetails,
        appletName: appletName || 'Интеллектуальный Агент RICIS'
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          currentRecord: data.currentRecord || null,
          records: data.records || []
        };
      }
    }
  } catch (e) {
    console.error('Error registering client GEO visit:', e);
  }

  return {
    currentRecord: null,
    records: []
  };
}

// Synchronous wrapper helpers for backward compatibility with UI components
let cachedGlobalRecords: GeoVisitorRecord[] = [];

export function getGeoVisitorRecords(): GeoVisitorRecord[] {
  return cachedGlobalRecords;
}

export async function refreshAndGetGeoVisitorRecords(): Promise<GeoVisitorRecord[]> {
  const data = await fetchGlobalGeoVisitors();
  cachedGlobalRecords = data.records;
  return data.records;
}

export async function fetchCurrentClientGeo(appletName?: string): Promise<GeoVisitorRecord | null> {
  const result = await recordClientGeoVisit(appletName);
  if (result.records) {
    cachedGlobalRecords = result.records;
  }
  return result.currentRecord;
}

export async function recordCurrentClientGeo(currentGeo: GeoVisitorRecord | null, appletName?: string) {
  const result = await recordClientGeoVisit(appletName);
  if (result.records) {
    cachedGlobalRecords = result.records;
  }
}
